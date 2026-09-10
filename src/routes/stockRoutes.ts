import express from 'express';
import {
  importStock,
  getTransactions,
  getProductBatches,
  consumeStock,
  adjustStock,
} from '../controllers/stockController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { checkPermission } from '../middlewares/permissionMiddleware.js';
import { validate } from '../middlewares/validate.js';
import {
  importStockSchema,
  consumeStockSchema,
  adjustStockSchema,
} from '../validations/stockValidation.js';

const router = express.Router();

router.use(protect);

// POST /api/stock/import — nhập kho
router.post('/import', checkPermission('inventory.import'), validate(importStockSchema), importStock);

// POST /api/stock/consume — xuất kho tiêu hao / điều trị
router.post(
  '/consume',
  checkPermission(['inventory.import', 'inventory.adjust', 'inventory.view']),
  validate(consumeStockSchema),
  consumeStock
);

// POST /api/stock/adjust — kiểm kê cân bằng kho
router.post(
  '/adjust',
  checkPermission(['inventory.adjust', 'inventory.import']),
  validate(adjustStockSchema),
  adjustStock
);

// GET /api/stock/products/:productId/batches — danh sách các lô hàng của sản phẩm
router.get(
  '/products/:productId/batches',
  checkPermission(['inventory.view', 'inventory.transactions']),
  getProductBatches
);

// GET /api/stock/transactions — lịch sử giao dịch
router.get('/transactions', checkPermission('inventory.transactions'), getTransactions);

export default router;

