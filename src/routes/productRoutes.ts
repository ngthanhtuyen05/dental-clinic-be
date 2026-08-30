import express from 'express';
import {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
} from '../controllers/productController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { checkPermission } from '../middlewares/permissionMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { createProductSchema, updateProductSchema } from '../validations/productValidation.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(checkPermission('inventory.view'), getProducts)
  .post(checkPermission(['inventory.view', 'inventory.import']), validate(createProductSchema), createProduct);

router.route('/:id')
  .get(checkPermission('inventory.view'), getProduct)
  .patch(checkPermission(['inventory.view', 'inventory.import']), validate(updateProductSchema), updateProduct)
  .delete(checkPermission(['inventory.view', 'inventory.import']), deleteProduct);

export default router;
