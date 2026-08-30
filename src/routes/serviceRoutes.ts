import express from 'express';
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  getServices, getService, createService, updateService, deleteService,
} from '../controllers/serviceController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { checkPermission } from '../middlewares/permissionMiddleware.js';
import { validate } from '../middlewares/validate.js';
import {
  createServiceSchema, updateServiceSchema,
  createCategorySchema, updateCategorySchema,
} from '../validations/serviceValidation.js';

const router = express.Router();

// ── Public Routes (Browse Services & Categories) ──
router.get('/', getServices);
router.get('/categories', getCategories);
router.get('/:id', getService);

// ── Protected Routes (Admin / Staff Write Actions with RBAC) ──
router.use(protect);

// Categories Actions
router.post('/categories', checkPermission('services.categories'), validate(createCategorySchema), createCategory);
router.patch('/categories/:id', checkPermission('services.categories'), validate(updateCategorySchema), updateCategory);
router.delete('/categories/:id', checkPermission('services.categories'), deleteCategory);

// Services Actions
router.post('/', checkPermission('services.create'), validate(createServiceSchema), createService);
router.patch('/:id', checkPermission('services.edit'), validate(updateServiceSchema), updateService);
router.delete('/:id', checkPermission('services.delete'), deleteService);

export default router;
