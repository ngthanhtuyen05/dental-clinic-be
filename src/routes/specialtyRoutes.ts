import express from 'express';
import {
  getSpecialties,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
} from '../controllers/specialtyController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { checkPermission } from '../middlewares/permissionMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { createSpecialtySchema, updateSpecialtySchema } from '../validations/specialtyValidation.js';

const router = express.Router();

// ── Public Routes (Xem danh sách chuyên khoa không cần đăng nhập) ──
router.get('/', getSpecialties);

// ── Protected Routes ──
router.use(protect);

router.post('/', checkPermission('staff.specialties'), validate(createSpecialtySchema), createSpecialty);

router.route('/:id')
  .patch(checkPermission('staff.specialties'), validate(updateSpecialtySchema), updateSpecialty)
  .delete(checkPermission('staff.specialties'), deleteSpecialty);

export default router;
