import express from 'express';
import { importStock, getTransactions } from '../controllers/stockController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { importStockSchema } from '../validations/stockValidation.js';
import { UserRole } from '../constants/enums.js';

const router = express.Router();

router.use(protect);

// POST /api/stock/import — nhập kho (ADMIN only)
router.post('/import', restrictTo(UserRole.ADMIN), validate(importStockSchema), importStock);

// GET /api/stock/transactions — lịch sử giao dịch
router.get('/transactions', getTransactions);

export default router;
