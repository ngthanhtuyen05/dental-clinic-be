import express from 'express';
import { getUsers, getUser, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { validate } from '../middlewares/validate.js';
import { createUserSchema, updateUserSchema } from '../validations/userValidation.js';
import { protect, restrictToOwnerOrAdmin } from '../middlewares/authMiddleware.js';
import { checkPermission } from '../middlewares/permissionMiddleware.js';

const router = express.Router();

// Tất cả routes bên dưới yêu cầu đăng nhập
router.use(protect);

router.route('/')
  .get(checkPermission('staff.view'), getUsers)
  .post(checkPermission('staff.create'), validate(createUserSchema), createUser);

router.route('/:id')
  .get(checkPermission('staff.view'), getUser)
  .patch(restrictToOwnerOrAdmin, validate(updateUserSchema), updateUser)
  .delete(checkPermission('staff.delete'), deleteUser);

export default router;
