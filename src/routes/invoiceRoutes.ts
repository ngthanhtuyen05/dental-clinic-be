import express from 'express';
import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  payInvoice,
  createMomoPayment,
  handleMomoIPN,
  cancelInvoice,
  getMomoDemoPage,
  confirmMomoDemoPayment,
} from '../controllers/invoiceController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { checkPermission } from '../middlewares/permissionMiddleware.js';
import { validate } from '../middlewares/validate.js';
import {
  createInvoiceSchema,
  payInvoiceSchema,
  createMomoPaymentSchema,
} from '../validations/invoiceValidation.js';

const router = express.Router();

// 1. Webhook IPN từ máy chủ MoMo (xác thực qua chữ ký số HMAC SHA-256)
router.post('/momo-ipn', handleMomoIPN);

// 2. Trang giả lập thanh toán MoMo Sandbox QR (chỉ cho dev / demo)
router.get('/:id/momo-demo', getMomoDemoPage);
router.post('/:id/momo-demo-confirm', confirmMomoDemoPayment);

// 3. Toàn bộ các API hóa đơn dưới đây bắt buộc phải đăng nhập
router.use(protect);

router.route('/')
  .post(checkPermission('invoices.create'), validate(createInvoiceSchema), createInvoice)
  .get(checkPermission('invoices.view'), getAllInvoices);

router.route('/:id')
  .get(checkPermission('invoices.view'), getInvoiceById);

router.patch('/:id/pay', checkPermission('invoices.payment'), validate(payInvoiceSchema), payInvoice);
router.post('/:id/momo', checkPermission('invoices.payment'), validate(createMomoPaymentSchema), createMomoPayment);
router.patch('/:id/cancel', checkPermission('invoices.cancel'), cancelInvoice);

export default router;
