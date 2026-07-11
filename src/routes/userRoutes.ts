import express from 'express';
import { getUsers, getUser, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { validate } from '../middlewares/validate.js';
import { createUserSchema, updateUserSchema } from '../validations/userValidation.js';
import { protect, restrictTo, restrictToOwnerOrAdmin } from '../middlewares/authMiddleware.js';
import { UserRole } from '../constants/enums.js';

const router = express.Router();

// Tất cả routes bên dưới yêu cầu đăng nhập
router.use(protect);

router.route('/')
  .get(restrictTo(UserRole.ADMIN, UserRole.DENTIST, UserRole.STAFF), getUsers)
  .post(restrictTo(UserRole.ADMIN), validate(createUserSchema), createUser);

router.route('/:id')
  .get(getUser)
  .patch(restrictToOwnerOrAdmin, validate(updateUserSchema), updateUser)
  .delete(restrictTo(UserRole.ADMIN), deleteUser);

export default router;
