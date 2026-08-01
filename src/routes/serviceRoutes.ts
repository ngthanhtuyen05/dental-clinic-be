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

// ── Public Routes (Browse Services & Categories) ──
router.get('/', getServices);
router.get('/categories', getCategories);
router.get('/:id', getService);

// ── Protected Routes (Admin Write Actions) ──
router.use(protect);

// Categories Admin Actions
router.post('/categories', restrictTo(UserRole.ADMIN), validate(createCategorySchema), createCategory);
router.patch('/categories/:id', restrictTo(UserRole.ADMIN), validate(updateCategorySchema), updateCategory);
router.delete('/categories/:id', restrictTo(UserRole.ADMIN), deleteCategory);

// Services Admin Actions
router.post('/', restrictTo(UserRole.ADMIN), validate(createServiceSchema), createService);
router.patch('/:id', restrictTo(UserRole.ADMIN), validate(updateServiceSchema), updateService);
router.delete('/:id', restrictTo(UserRole.ADMIN), deleteService);

export default router;
