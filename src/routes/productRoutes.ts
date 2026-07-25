import express from 'express';
import {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
} from '../controllers/productController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { createProductSchema, updateProductSchema } from '../validations/productValidation.js';
import { UserRole } from '../constants/enums.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getProducts)
  .post(restrictTo(UserRole.ADMIN), validate(createProductSchema), createProduct);

router.route('/:id')
  .get(getProduct)
  .patch(restrictTo(UserRole.ADMIN), validate(updateProductSchema), updateProduct)
  .delete(restrictTo(UserRole.ADMIN), deleteProduct);

export default router;
