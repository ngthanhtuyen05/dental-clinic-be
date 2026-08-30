import express from 'express';
import { importStock, getTransactions } from '../controllers/stockController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { checkPermission } from '../middlewares/permissionMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { importStockSchema } from '../validations/stockValidation.js';

const router = express.Router();

router.use(protect);

// POST /api/stock/import — nhập kho
router.post('/import', checkPermission('inventory.import'), validate(importStockSchema), importStock);

// GET /api/stock/transactions — lịch sử giao dịch
router.get('/transactions', checkPermission('inventory.transactions'), getTransactions);

export default router;
