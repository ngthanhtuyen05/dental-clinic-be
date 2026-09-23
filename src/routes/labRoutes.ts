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
import { checkPermission } from '../middlewares/permissionMiddleware.js';
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
  .get(checkPermission('labo.view'), getAllOrders)
  .post(checkPermission('labo.create'), validate(createLabOrderSchema), createOrder);

router.route('/orders/:id')
  .get(checkPermission('labo.view'), getOrderById)
  .patch(checkPermission('labo.edit'), validate(updateLabOrderSchema), updateOrder)
  .delete(checkPermission('labo.edit'), deleteOrder);

router.patch('/orders/:id/status', checkPermission('labo.edit'), validate(updateLabOrderStatusSchema), updateOrderStatus);
router.patch('/orders/:id/payment', checkPermission('labo.reconciliation'), validate(updateLabOrderPaymentSchema), updateOrderPayment);

// ── 2. Xưởng đối tác ──
router.get('/suppliers', checkPermission('labo.view'), getSuppliers);

// ── 3. Thẻ bảo hành phục hình ──
router.route('/warranties')
  .get(checkPermission('labo.warranty'), getWarrantyCards)
  .post(checkPermission('labo.warranty'), validate(createLabWarrantyCardSchema), createWarrantyCard);

router.get('/warranties/:id', checkPermission('labo.warranty'), getWarrantyCardById);

// ── 4. Đối soát công nợ ──
router.get('/reconciliation', checkPermission('labo.reconciliation'), getReconciliation);

export default router;
