import { Request, Response } from 'express';
import { Invoice, PatientProfile, Appointment, TreatmentHistory, Prescription, User } from '../models/index.js';
import { InvoiceStatus, PaymentMethod } from '../constants/enums.js';
import { createMoMoPaymentUrl, verifyMoMoSignature } from '../services/momoService.js';

export const createInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      patientProfileId,
      appointmentId,
      treatmentHistoryId,
      prescriptionId,
      totalAmount,
      discountAmount,
      notes,
    } = req.body;

    const creatorId = (req as any).user?.id || null;

    if (!patientProfileId) {
      res.status(400).json({ status: 'error', message: 'patientProfileId is required' });
      return;
    }

    let calculatedAmount = Number(totalAmount) || 0;
    const discount = Number(discountAmount) || 0;

    // Auto calculate from Treatment History if totalAmount not supplied
    if (!calculatedAmount && treatmentHistoryId) {
      const treatment = await TreatmentHistory.findByPk(Number(treatmentHistoryId));
      if (treatment) {
        calculatedAmount = Number(treatment.cost) || 0;
      }
    }

    const code = `INV-${Date.now()}`;

    const invoice = await Invoice.create({
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
    });

    res.status(201).json({
      status: 'success',
      data: invoice,
    });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
  }
};

export const getAllInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientProfileId, status } = req.query;

    const where: any = {};
    if (patientProfileId) where.patientProfileId = Number(patientProfileId);
    if (status) where.status = status;

    const invoices = await Invoice.findAll({
      where,
      include: [
        { model: PatientProfile, as: 'patientProfile', include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] }] },
        { model: Appointment, as: 'appointment' },
        { model: TreatmentHistory, as: 'treatmentHistory' },
        { model: Prescription, as: 'prescription' },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      data: invoices,
    });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
  }
};

export const getInvoiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const invoice = await Invoice.findByPk(id, {
      include: [
        { model: PatientProfile, as: 'patientProfile', include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] }] },
        { model: Appointment, as: 'appointment' },
        { model: TreatmentHistory, as: 'treatmentHistory' },
        { model: Prescription, as: 'prescription' },
        { model: User, as: 'creator', attributes: ['id', 'fullName', 'email'] },
      ],
    });

    if (!invoice) {
      res.status(404).json({ status: 'error', message: 'Invoice not found' });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: invoice,
    });
  } catch (error: any) {
    console.error('Error fetching invoice details:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
  }
};

export const payInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { paymentMethod } = req.body;

    if (!paymentMethod || ![PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER].includes(paymentMethod)) {
      res.status(400).json({ status: 'error', message: 'Valid paymentMethod (cash, bank_transfer) is required' });
      return;
    }

    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      res.status(404).json({ status: 'error', message: 'Invoice not found' });
      return;
    }

    if (invoice.status === InvoiceStatus.PAID) {
      res.status(400).json({ status: 'error', message: 'Invoice is already paid' });
      return;
    }

    invoice.status = InvoiceStatus.PAID;
    invoice.paymentMethod = paymentMethod as PaymentMethod;
    invoice.paidAt = new Date();
    await invoice.save();

    res.status(200).json({
      status: 'success',
      message: 'Invoice marked as paid successfully',
      data: invoice,
    });
  } catch (error: any) {
    console.error('Error paying invoice:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
  }
};

export const createMomoPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      res.status(404).json({ status: 'error', message: 'Invoice not found' });
      return;
    }

    if (invoice.status === InvoiceStatus.PAID) {
      res.status(400).json({ status: 'error', message: 'Invoice is already paid' });
      return;
    }

    const finalPayable = Math.max(0, Number(invoice.totalAmount) - Number(invoice.discountAmount || 0));

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';

    const redirectUrl = req.body.redirectUrl && !req.body.redirectUrl.includes('localhost')
      ? req.body.redirectUrl
      : 'https://momo.vn';
    const ipnUrl = 'https://webhook.site/momo-ipn';

    const momoResult: any = await createMoMoPaymentUrl({
      orderId: invoice.code,
      amount: Math.round(finalPayable),
      orderInfo: `Thanh toan hoa don nha khoa ${invoice.code}`,
      redirectUrl,
      ipnUrl,
    });

    const demoPayUrl = `${protocol}://${host}/api/invoices/${invoice.id}/momo-demo`;

    res.status(200).json({
      status: 'success',
      data: {
        ...momoResult,
        payUrl: (momoResult && momoResult.resultCode === 0 && momoResult.payUrl) ? momoResult.payUrl : demoPayUrl,
      },
    });
  } catch (error: any) {
    console.error('Error creating MoMo payment:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
  }
};

export const getMomoDemoPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const invoice = await Invoice.findByPk(id, {
      include: [{ model: PatientProfile, as: 'patientProfile', include: ['user'] }],
    });

    if (!invoice) {
      res.status(404).send('Hóa đơn không tồn tại');
      return;
    }

    const amount = Math.max(0, Number(invoice.totalAmount) - Number(invoice.discountAmount || 0));
    const patientName = invoice.patientProfile?.user?.fullName || `Bệnh nhân #${invoice.patientProfileId}`;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://momo.vn/pay?amount=${amount}&orderId=${invoice.code}`;

    const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cổng Thanh Toán MoMo Sandbox - Giả Lập QR</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f4f5f7; margin: 0; padding: 40px 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; box-sizing: border-box; }
        .card { background: #fff; border-radius: 20px; box-shadow: 0 12px 40px rgba(174,32,112,0.12); max-width: 440px; width: 100%; padding: 32px; text-align: center; }
        .momo-header { background: #ae2070; color: white; padding: 16px; border-radius: 14px; margin-bottom: 16px; font-weight: bold; font-size: 20px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .info-row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px; border-bottom: 1px dashed #eee; padding-bottom: 8px; color: #555; }
        .amount { color: #ae2070; font-size: 26px; font-weight: 800; margin: 16px 0 8px 0; }
        .qr-box { background: #fff0f6; border: 2px dashed #ae2070; border-radius: 16px; padding: 20px; margin: 20px 0; display: inline-block; }
        .qr-img { width: 180px; height: 180px; border-radius: 8px; }
        .qr-hint { font-size: 13px; color: #8c8c8c; margin-top: 8px; }
        .btn { background: #ae2070; color: white; border: none; padding: 14px 28px; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer; width: 100%; transition: all 0.2s; box-shadow: 0 4px 12px rgba(174,32,112,0.3); }
        .btn:hover { background: #8e185b; transform: translateY(-1px); }
        .tag { background: #fff0f6; color: #ae2070; border: 1px solid #ffadd2; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; margin-bottom: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="momo-header">
          <span>Ví Điện Tử MoMo Sandbox</span>
        </div>
        <div class="tag">Cổng Thanh Toán Thử Nghiệm Qua QR</div>

        <div class="qr-box">
          <img src="${qrUrl}" alt="MoMo QR Code" class="qr-img" />
          <div class="qr-hint">Quét mã QR bằng ứng dụng MoMo hoặc nút bấm thử nghiệm bên dưới</div>
        </div>

        <div class="info-row"><span>Mã hóa đơn:</span><strong>${invoice.code}</strong></div>
        <div class="info-row"><span>Bệnh nhân:</span><strong>${patientName}</strong></div>
        <div class="info-row"><span>Dịch vụ:</span><strong>Khám & Điều trị nha khoa</strong></div>

        <div class="amount">${amount.toLocaleString('vi-VN')} VNĐ</div>

        <form action="/api/invoices/${invoice.id}/momo-demo-confirm" method="POST">
          <button type="submit" class="btn">Giả Lập Quét Mã & Thanh Toán Thành Công</button>
        </form>
      </div>
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err: any) {
    res.status(500).send('Lỗi hệ thống');
  }
};

export const confirmMomoDemoPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const invoice = await Invoice.findByPk(id);

    if (invoice) {
      invoice.status = InvoiceStatus.PAID;
      invoice.paymentMethod = PaymentMethod.MOMO;
      invoice.paidAt = new Date();
      invoice.momoTransId = `MOMO-TEST-${Date.now()}`;
      await invoice.save();
    }

    res.redirect('http://localhost:5173/invoices');
  } catch (err: any) {
    res.status(500).send('Lỗi thanh toán');
  }
};

export const handleMomoIPN = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;
    console.log('Received MoMo IPN Callback:', body);

    const isValid = verifyMoMoSignature(body);
    if (!isValid) {
      console.warn('Invalid MoMo IPN signature');
      res.status(400).json({ status: 'error', message: 'Invalid signature' });
      return;
    }

    const { orderId, resultCode, transId } = body;

    if (Number(resultCode) === 0) {
      const invoice = await Invoice.findOne({ where: { code: orderId } });
      if (invoice && invoice.status !== InvoiceStatus.PAID) {
        invoice.status = InvoiceStatus.PAID;
        invoice.paymentMethod = PaymentMethod.MOMO;
        invoice.paidAt = new Date();
        invoice.momoTransId = String(transId || '');
        await invoice.save();
        console.log(`Invoice ${orderId} successfully marked as PAID via MoMo IPN`);
      }
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Error handling MoMo IPN:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
  }
};

export const cancelInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      res.status(404).json({ status: 'error', message: 'Invoice not found' });
      return;
    }

    if (invoice.status === InvoiceStatus.PAID) {
      res.status(400).json({ status: 'error', message: 'Cannot cancel a paid invoice' });
      return;
    }

    invoice.status = InvoiceStatus.CANCELLED;
    await invoice.save();

    res.status(200).json({
      status: 'success',
      message: 'Invoice cancelled successfully',
      data: invoice,
    });
  } catch (error: any) {
    console.error('Error cancelling invoice:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
  }
};
