import express from 'express';
import {
  getSpecialties,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
} from '../controllers/specialtyController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { createSpecialtySchema, updateSpecialtySchema } from '../validations/specialtyValidation.js';
import { UserRole } from '../constants/enums.js';

const router = express.Router();

// ── Public Routes (Xem danh sách chuyên khoa không cần đăng nhập) ──
router.get('/', getSpecialties);

// ── Protected Routes (Chỉ Admin mới có quyền thêm/sửa/xóa) ──
router.use(protect);
router.use(restrictTo(UserRole.ADMIN));

router.post('/', validate(createSpecialtySchema), createSpecialty);

router.route('/:id')
  .patch(validate(updateSpecialtySchema), updateSpecialty)
  .delete(deleteSpecialty);

export default router;
