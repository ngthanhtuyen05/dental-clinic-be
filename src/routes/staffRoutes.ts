import express from 'express';
import {
  getStaffList, getStaffDetail, getStaffStats,
  createStaff, updateStaff, resetPassword, toggleStatus,
} from '../controllers/staffController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { checkPermission } from '../middlewares/permissionMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { createStaffSchema, updateStaffSchema } from '../validations/staffValidation.js';

const router = express.Router();

// ── Public Routes (Khách vãng lai xem danh sách bác sĩ / chi tiết bác sĩ để đặt hẹn) ──
router.get('/', getStaffList);
router.get('/:id', getStaffDetail);

// ── Protected Routes with RBAC ──
router.use(protect);

router.post('/', checkPermission('staff.create'), validate(createStaffSchema), createStaff);
router.get('/stats', checkPermission('staff.view'), getStaffStats);

router.patch('/:id', checkPermission('staff.edit'), validate(updateStaffSchema), updateStaff);
router.patch('/:id/reset-password', checkPermission('staff.edit'), resetPassword);
router.patch('/:id/toggle-status', checkPermission('staff.edit'), toggleStatus);

export default router;
