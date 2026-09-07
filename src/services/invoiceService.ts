import crypto from 'crypto';
import { invoiceRepository } from '../repositories/invoiceRepository.js';
import { TreatmentHistory } from '../models/index.js';
import { InvoiceStatus, PaymentMethod } from '../constants/enums.js';
import { createMoMoPaymentUrl, verifyMoMoSignature } from './momoService.js';
import AppError from '../utils/AppError.js';
import HttpStatus from '../constants/httpStatus.js';
import env from '../config/env.js';
import type { CreateInvoiceInput } from '../validations/invoiceValidation.js';
import type { InvoiceModel } from '../models/invoiceModel.js';

export const createInvoice = async (
  input: CreateInvoiceInput,
  creatorId: number | null
): Promise<InvoiceModel> => {
  const {
    patientProfileId,
    appointmentId,
    treatmentHistoryId,
    prescriptionId,
    totalAmount,
    discountAmount,
    notes,
  } = input;

  let calculatedAmount = Number(totalAmount) || 0;
  const discount = Number(discountAmount) || 0;

  // Tự động lấy chi phí từ đợt điều trị nếu client không truyền số tiền
  if (!calculatedAmount && treatmentHistoryId) {
    const treatment = await TreatmentHistory.findByPk(Number(treatmentHistoryId));
    if (treatment) {
      calculatedAmount = Number(treatment.cost) || 0;
    }
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  const code = `INV-${dateStr}-${randomHex}`;

  return invoiceRepository.create({
    code,
    patientProfileId: Number(patientProfileId),
    appointmentId: appointmentId ? Number(appointmentId) : null,
    treatmentHistoryId: treatmentHistoryId ? Number(treatmentHistoryId) : null,
    prescriptionId: prescriptionId ? Number(prescriptionId) : null,
    totalAmount: calculatedAmount,
    discountAmount: discount,
    status: InvoiceStatus.UNPAID,
    notes: notes || null,
    createdBy: creatorId,
  } as any);
};

export const getAllInvoices = async (filters: {
  patientProfileId?: number;
  status?: string;
}): Promise<InvoiceModel[]> => {
  const where: any = {};
  if (filters.patientProfileId) {
    where.patientProfileId = Number(filters.patientProfileId);
  }
  if (filters.status) {
    where.status = filters.status;
  }

  return invoiceRepository.findAll({ where });
};

export const getInvoiceById = async (id: number | string): Promise<InvoiceModel> => {
  const invoice = await invoiceRepository.findById(id);
  if (!invoice) {
    throw new AppError('Không tìm thấy hóa đơn', HttpStatus.NOT_FOUND);
  }
  return invoice;
};

export const payInvoice = async (
  id: number | string,
  paymentMethod: PaymentMethod
): Promise<InvoiceModel> => {
  const invoice = await invoiceRepository.findRawById(id);
  if (!invoice) {
    throw new AppError('Không tìm thấy hóa đơn', HttpStatus.NOT_FOUND);
  }

  if (invoice.status === InvoiceStatus.PAID) {
    throw new AppError('Hóa đơn này đã được thanh toán từ trước', HttpStatus.BAD_REQUEST);
  }

  await invoiceRepository.update(invoice, {
    status: InvoiceStatus.PAID,
    paymentMethod,
    paidAt: new Date(),
  });

  const fullInvoice = await invoiceRepository.findById(invoice.id);
  return fullInvoice || invoice;
};

export const createMomoPayment = async (
  id: number | string,
  meta: { host: string; protocol: string; redirectUrl?: string }
) => {
  const invoice = await invoiceRepository.findRawById(id);
  if (!invoice) {
    throw new AppError('Không tìm thấy hóa đơn', HttpStatus.NOT_FOUND);
  }

  if (invoice.status === InvoiceStatus.PAID) {
    throw new AppError('Hóa đơn này đã được thanh toán', HttpStatus.BAD_REQUEST);
  }

  const finalPayable = Math.max(0, Number(invoice.totalAmount) - Number(invoice.discountAmount || 0));

  const redirectUrl =
    meta.redirectUrl && !meta.redirectUrl.includes('localhost')
      ? meta.redirectUrl
      : `${env.CLIENT_URL}/invoices`;

  const ipnUrl = 'https://webhook.site/momo-ipn';

  const momoResult: any = await createMoMoPaymentUrl({
    orderId: invoice.code,
    amount: Math.round(finalPayable),
    orderInfo: `Thanh toan hoa don nha khoa ${invoice.code}`,
    redirectUrl,
    ipnUrl,
  });

  const demoPayUrl = `${meta.protocol}://${meta.host}/api/invoices/${invoice.id}/momo-demo`;

  return {
    ...momoResult,
    payUrl: momoResult && momoResult.resultCode === 0 && momoResult.payUrl ? momoResult.payUrl : demoPayUrl,
  };
};

export const handleMomoIPN = async (body: Record<string, any>): Promise<void> => {
  const isValid = verifyMoMoSignature(body);
  if (!isValid) {
    throw new AppError('Chữ ký số MoMo IPN không hợp lệ', HttpStatus.BAD_REQUEST);
  }

  const { orderId, resultCode, transId } = body;
  if (Number(resultCode) === 0) {
    const invoice = await invoiceRepository.findByCode(orderId);
    if (invoice && invoice.status !== InvoiceStatus.PAID) {
      await invoiceRepository.update(invoice, {
        status: InvoiceStatus.PAID,
        paymentMethod: PaymentMethod.MOMO,
        paidAt: new Date(),
        momoTransId: String(transId || ''),
      });
    }
  }
};

export const confirmMomoDemoPayment = async (id: number | string): Promise<void> => {
  // Chỉ cho phép chạy ở môi trường Development
  if (env.isProduction) {
    throw new AppError('Hành động giả lập thanh toán bị cấm trên môi trường Production.', HttpStatus.FORBIDDEN);
  }

  const invoice = await invoiceRepository.findRawById(id);
  if (!invoice) {
    throw new AppError('Không tìm thấy hóa đơn', HttpStatus.NOT_FOUND);
  }

  if (invoice.status !== InvoiceStatus.PAID) {
    await invoiceRepository.update(invoice, {
      status: InvoiceStatus.PAID,
      paymentMethod: PaymentMethod.MOMO,
      paidAt: new Date(),
      momoTransId: `MOMO-TEST-${Date.now()}`,
    });
  }
};

export const cancelInvoice = async (id: number | string): Promise<InvoiceModel> => {
  const invoice = await invoiceRepository.findRawById(id);
  if (!invoice) {
    throw new AppError('Không tìm thấy hóa đơn', HttpStatus.NOT_FOUND);
  }

  if (invoice.status === InvoiceStatus.PAID) {
    throw new AppError('Không thể hủy hóa đơn đã thanh toán', HttpStatus.BAD_REQUEST);
  }

  await invoiceRepository.update(invoice, {
    status: InvoiceStatus.CANCELLED,
  });

  return invoice;
};
