import express from 'express';
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  getServices, getService, createService, updateService, deleteService,
} from '../controllers/serviceController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import {
  createServiceSchema, updateServiceSchema,
  createCategorySchema, updateCategorySchema,
} from '../validations/serviceValidation.js';
import { UserRole } from '../constants/enums.js';

const router = express.Router();

router.use(protect);

// ── Categories ──
router.route('/categories')
  .get(getCategories)
  .post(restrictTo(UserRole.ADMIN), validate(createCategorySchema), createCategory);

router.route('/categories/:id')
  .patch(restrictTo(UserRole.ADMIN), validate(updateCategorySchema), updateCategory)
  .delete(restrictTo(UserRole.ADMIN), deleteCategory);

// ── Services ──
router.route('/')
  .get(getServices)
  .post(restrictTo(UserRole.ADMIN), validate(createServiceSchema), createService);

router.route('/:id')
  .get(getService)
  .patch(restrictTo(UserRole.ADMIN), validate(updateServiceSchema), updateService)
  .delete(restrictTo(UserRole.ADMIN), deleteService);

export default router;
