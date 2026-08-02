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

const router = express.Router();

// Public IPN Webhook callback from MoMo servers & Demo Page (No JWT required)
router.post('/momo-ipn', handleMomoIPN);
router.get('/:id/momo-demo', getMomoDemoPage);
router.post('/:id/momo-demo-confirm', confirmMomoDemoPayment);

// Protected routes below
router.use(protect);

router.route('/')
  .post(createInvoice)
  .get(getAllInvoices);

router.route('/:id')
  .get(getInvoiceById);

router.patch('/:id/pay', payInvoice);
router.post('/:id/momo', createMomoPayment);
router.patch('/:id/cancel', cancelInvoice);

export default router;
