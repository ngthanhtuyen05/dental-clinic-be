import express from 'express';
import {
  getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier,
} from '../controllers/supplierController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { checkPermission } from '../middlewares/permissionMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { createSupplierSchema, updateSupplierSchema } from '../validations/supplierValidation.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(checkPermission('inventory.suppliers'), getSuppliers)
  .post(checkPermission('inventory.suppliers'), validate(createSupplierSchema), createSupplier);

router.route('/:id')
  .get(checkPermission('inventory.suppliers'), getSupplier)
  .patch(checkPermission('inventory.suppliers'), validate(updateSupplierSchema), updateSupplier)
  .delete(checkPermission('inventory.suppliers'), deleteSupplier);

export default router;
