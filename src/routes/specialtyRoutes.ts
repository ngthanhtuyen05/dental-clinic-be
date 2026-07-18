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

// Tất cả API cấu hình chuyên khoa yêu cầu đăng nhập + vai trò Admin
router.use(protect);
router.use(restrictTo(UserRole.ADMIN));

router.route('/')
  .get(getSpecialties)
  .post(validate(createSpecialtySchema), createSpecialty);

router.route('/:id')
  .patch(validate(updateSpecialtySchema), updateSpecialty)
  .delete(deleteSpecialty);

export default router;
