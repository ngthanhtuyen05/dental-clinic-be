import express from 'express';
import {
  getRoles,
  getRoleDetail,
  createRole,
  updateRole,
  updatePermissions,
  deleteRole,
} from '../controllers/roleController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import {
  createRoleSchema,
  updateRoleSchema,
  updatePermissionsSchema,
} from '../validations/roleValidation.js';
import { UserRole } from '../constants/enums.js';

const router = express.Router();

// Tất cả routes quản lý vai trò đều yêu cầu đăng nhập và quyền Admin
router.use(protect);
router.use(restrictTo(UserRole.ADMIN));

router.get('/', getRoles);
router.get('/:id', getRoleDetail);
router.post('/', validate(createRoleSchema), createRole);
router.patch('/:id', validate(updateRoleSchema), updateRole);
router.put('/:id/permissions', validate(updatePermissionsSchema), updatePermissions);
router.delete('/:id', deleteRole);

export default router;
