import express from 'express';
import {
  getAllSettings,
  getSettingByKey,
  updateSetting,
  getPublicClinicSettings,
} from '../controllers/settingController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { checkPermission } from '../middlewares/permissionMiddleware.js';

const router = express.Router();

// Public endpoint (cho Website bệnh nhân xem thông tin phòng khám & giờ làm việc)
router.get('/public/clinic', getPublicClinicSettings);

// Tất cả routes bên dưới yêu cầu đăng nhập
router.use(protect);

router.route('/')
  .get(checkPermission('settings.clinic_info'), getAllSettings);

router.route('/:key')
  .get(checkPermission('settings.clinic_info'), getSettingByKey)
  .put(checkPermission('settings.clinic_info'), updateSetting)
  .patch(checkPermission('settings.clinic_info'), updateSetting);

export default router;
