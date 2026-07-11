import express from 'express';
import { getProfile, createProfile, updateProfile } from '../controllers/patientProfileController.js';
import { validate } from '../middlewares/validate.js';
import { createPatientProfileSchema, updatePatientProfileSchema } from '../validations/patientProfileValidation.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { UserRole } from '../constants/enums.js';

const router = express.Router();

// Tất cả các tuyến đường cần xác thực đăng nhập
router.use(protect);

// Tạo mới Hồ sơ (Cho phép cả Admin, Bác sĩ, Nhân viên và Bệnh nhân tự tạo)
router.post('/', restrictTo(UserRole.ADMIN, UserRole.DENTIST, UserRole.STAFF, UserRole.PATIENT), validate(createPatientProfileSchema), createProfile);

// Xem & Cập nhật Hồ sơ nền
router.route('/:userId')
  .get(getProfile)
  .patch(validate(updatePatientProfileSchema), updateProfile);

export default router;
