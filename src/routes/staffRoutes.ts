import express from 'express';
import {
  getStaffList, getStaffDetail, getStaffStats,
  createStaff, updateStaff, resetPassword, toggleStatus,
} from '../controllers/staffController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { createStaffSchema, updateStaffSchema } from '../validations/staffValidation.js';
import { UserRole } from '../constants/enums.js';

const router = express.Router();

// All staff routes require auth + admin role
router.use(protect);
router.use(restrictTo(UserRole.ADMIN));

router.route('/')
  .get(getStaffList)
  .post(validate(createStaffSchema), createStaff);

router.get('/stats', getStaffStats);

router.route('/:id')
  .get(getStaffDetail)
  .patch(validate(updateStaffSchema), updateStaff);

router.patch('/:id/reset-password', resetPassword);
router.patch('/:id/toggle-status', toggleStatus);

export default router;
