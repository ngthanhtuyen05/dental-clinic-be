import { Request, Response, NextFunction } from 'express';
import * as invoiceService from '../services/invoiceService.js';
import HttpStatus from '../constants/httpStatus.js';
import env from '../config/env.js';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

export const createInvoice = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const creatorId = req.user?.id || null;
    const invoice = await invoiceService.createInvoice(req.body, creatorId);

    res.status(HttpStatus.CREATED).json({
      status: 'success',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { patientProfileId, status } = req.query;
    const invoices = await invoiceService.getAllInvoices({
      patientProfileId: patientProfileId ? Number(patientProfileId) : undefined,
      status: status as string,
    });

    res.status(HttpStatus.OK).json({
      status: 'success',
      data: invoices,
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const invoice = await invoiceService.getInvoiceById(id);

    res.status(HttpStatus.OK).json({
      status: 'success',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

export const payInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { paymentMethod } = req.body;
    const invoice = await invoiceService.payInvoice(id, paymentMethod);

    res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Hóa đơn đã được ghi nhận thanh toán thành công',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

export const createMomoPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';

    const result = await invoiceService.createMomoPayment(id, {
      host,
      protocol,
      redirectUrl: req.body.redirectUrl,
    });

    res.status(HttpStatus.OK).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const handleMomoIPN = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await invoiceService.handleMomoIPN(req.body);
    res.status(HttpStatus.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};

export const confirmMomoDemoPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    await invoiceService.confirmMomoDemoPayment(id);
    res.redirect(`${env.CLIENT_URL}/invoices`);
  } catch (error) {
    next(error);
  }
};

export const cancelInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const invoice = await invoiceService.cancelInvoice(id);

    res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Hóa đơn đã được hủy thành công',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

export const getMomoDemoPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const invoice = await invoiceService.getInvoiceById(id);

    const amount = Math.max(0, Number(invoice.totalAmount) - Number(invoice.discountAmount || 0));
    const patientName = (invoice as any).patientProfile?.user?.fullName || `Bệnh nhân #${invoice.patientProfileId}`;
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
        <div class="momo-header"><span>Ví Điện Tử MoMo Sandbox</span></div>
        <div class="tag">Cổng Thanh Toán Thử Nghiệm Qua QR</div>
        <div class="qr-box">
          <img src="${qrUrl}" alt="MoMo QR Code" class="qr-img" />
          <div class="qr-hint">Quét mã QR bằng ứng dụng MoMo hoặc nút bấm thử nghiệm bên dưới</div>
        </div>
        <div class="info-row"><span>Mã hóa đơn:</span><strong>${invoice.code}</strong></div>
        <div class="info-row"><span>Bệnh nhân:</span><strong>${patientName}</strong></div>
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
  } catch (error) {
    next(error);
  }
};
