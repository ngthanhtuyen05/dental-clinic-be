import express, { Response, NextFunction } from 'express';
import { getUploadSignature, UPLOAD_FOLDERS } from '../controllers/uploadController.js';
import { protect, type AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { checkPermission } from '../middlewares/permissionMiddleware.js';

const router = express.Router();

router.use(protect);

/**
 * Quyền yêu cầu khác nhau theo từng loại thư mục:
 * - xray   → cần quyền cập nhật hồ sơ bệnh lý
 * - avatar → chỉ cần đăng nhập (ai cũng đổi được ảnh của chính mình)
 */
const checkFolderPermission = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const folderKey = String(req.query.folder || 'xray');
  const permission = UPLOAD_FOLDERS[folderKey]?.permission;

  // Thư mục lạ sẽ do controller trả lỗi 400 với thông báo rõ ràng
  if (!permission) return next();

  return checkPermission(permission)(req, res, next);
};

router.get('/signature', checkFolderPermission, getUploadSignature);

export default router;
