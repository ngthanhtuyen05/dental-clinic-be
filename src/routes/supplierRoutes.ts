import express from 'express';
import {
  getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier,
} from '../controllers/supplierController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { createSupplierSchema, updateSupplierSchema } from '../validations/supplierValidation.js';
import { UserRole } from '../constants/enums.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getSuppliers)
  .post(restrictTo(UserRole.ADMIN), validate(createSupplierSchema), createSupplier);

router.route('/:id')
  .get(getSupplier)
  .patch(restrictTo(UserRole.ADMIN), validate(updateSupplierSchema), updateSupplier)
  .delete(restrictTo(UserRole.ADMIN), deleteSupplier);

export default router;
