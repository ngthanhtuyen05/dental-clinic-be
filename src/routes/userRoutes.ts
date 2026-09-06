import express, { Response, NextFunction } from 'express';
import { getUsers, getUser, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { validate } from '../middlewares/validate.js';
import { createUserSchema, updateUserSchema } from '../validations/userValidation.js';
import { protect, restrictToOwnerOrAdmin, AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { checkPermission } from '../middlewares/permissionMiddleware.js';
import { UserRole } from '../constants/enums.js';

const router = express.Router();

// Middleware: Cho phép chính chủ, Admin hoặc nhân sự có quyền xem thông tin người dùng
const allowOwnerOrStaffView = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userIdParam = parseInt(req.params.id as string, 10);
  if (req.user && (req.user.id === userIdParam || req.user.role === UserRole.ADMIN)) {
    return next();
  }
  return checkPermission('staff.view')(req, res, next);
};

// Tất cả routes bên dưới yêu cầu đăng nhập
router.use(protect);

router.route('/')
  .get(checkPermission('staff.view'), getUsers)
  .post(checkPermission('staff.create'), validate(createUserSchema), createUser);

router.route('/:id')
  .get(allowOwnerOrStaffView, getUser)
  .patch(restrictToOwnerOrAdmin, validate(updateUserSchema), updateUser)
  .delete(checkPermission('staff.delete'), deleteUser);

export default router;
