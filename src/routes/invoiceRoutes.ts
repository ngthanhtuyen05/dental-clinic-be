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

const router = express.Router();

// Public IPN Webhook callback from MoMo servers & Demo Page (No JWT required)
router.post('/momo-ipn', handleMomoIPN);
router.get('/:id/momo-demo', getMomoDemoPage);
router.post('/:id/momo-demo-confirm', confirmMomoDemoPayment);

// Protected routes below
router.use(protect);

router.route('/')
  .post(checkPermission('invoices.create'), createInvoice)
  .get(checkPermission('invoices.view'), getAllInvoices);

router.route('/:id')
  .get(checkPermission('invoices.view'), getInvoiceById);

router.patch('/:id/pay', checkPermission('invoices.payment'), payInvoice);
router.post('/:id/momo', checkPermission('invoices.payment'), createMomoPayment);
router.patch('/:id/cancel', checkPermission('invoices.cancel'), cancelInvoice);

export default router;
