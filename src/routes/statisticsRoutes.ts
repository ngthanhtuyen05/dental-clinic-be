import express from 'express';
import {
  getAppointmentStats,
  getClinicalStats,
} from '../controllers/statisticsController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { checkPermission } from '../middlewares/permissionMiddleware.js';

const router = express.Router();

// Tất cả endpoints thống kê yêu cầu đăng nhập
router.use(protect);

// Thống kê lịch khám
router.get('/appointments', checkPermission('appointments.view'), getAppointmentStats);

// Thống kê lâm sàng & điều trị
router.get('/clinical', checkPermission(['appointments.view', 'patients.view']), getClinicalStats);

export default router;
