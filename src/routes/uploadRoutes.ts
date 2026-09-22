import express from 'express';
import { getUploadSignature } from '../controllers/uploadController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { checkPermission } from '../middlewares/permissionMiddleware.js';

const router = express.Router();

// Chỉ người đăng nhập và có quyền cập nhật hồ sơ bệnh lý mới xin được chữ ký upload
router.use(protect);

router.get('/signature', checkPermission('patients.medical_history'), getUploadSignature);

export default router;
