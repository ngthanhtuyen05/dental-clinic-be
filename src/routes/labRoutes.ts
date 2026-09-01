import express from 'express';
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  updateOrderPayment,
  deleteOrder,
  getSuppliers,
  getWarrantyCards,
  getWarrantyCardById,
  createWarrantyCard,
  getReconciliation,
} from '../controllers/labController.js';
import { validate } from '../middlewares/validate.js';
import { protect } from '../middlewares/authMiddleware.js';
import {
  createLabOrderSchema,
  updateLabOrderSchema,
  updateLabOrderStatusSchema,
  updateLabOrderPaymentSchema,
  createLabWarrantyCardSchema,
} from '../validations/labValidation.js';

const router = express.Router();

// Tất cả endpoints Labo yêu cầu đăng nhập
router.use(protect);

// ── 1. Đơn hàng Labo ──
router.route('/orders')
  .get(getAllOrders)
  .post(validate(createLabOrderSchema), createOrder);

router.route('/orders/:id')
  .get(getOrderById)
  .patch(validate(updateLabOrderSchema), updateOrder)
  .delete(deleteOrder);

router.patch('/orders/:id/status', validate(updateLabOrderStatusSchema), updateOrderStatus);
router.patch('/orders/:id/payment', validate(updateLabOrderPaymentSchema), updateOrderPayment);

// ── 2. Xưởng đối tác ──
router.get('/suppliers', getSuppliers);

// ── 3. Thẻ bảo hành phục hình ──
router.route('/warranties')
  .get(getWarrantyCards)
  .post(validate(createLabWarrantyCardSchema), createWarrantyCard);

router.get('/warranties/:id', getWarrantyCardById);

// ── 4. Đối soát công nợ ──
router.get('/reconciliation', getReconciliation);

export default router;
