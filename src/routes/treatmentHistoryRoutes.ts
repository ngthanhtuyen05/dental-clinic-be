import express from 'express';
import { 
  getTreatmentsByProfileId, 
  createTreatment, 
  getTreatmentDetail, 
  updateTreatment, 
  deleteTreatment 
} from '../controllers/treatmentHistoryController.js';
import { validate } from '../middlewares/validate.js';
import { createTreatmentHistorySchema, updateTreatmentHistorySchema } from '../validations/treatmentHistoryValidation.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { UserRole } from '../constants/enums.js';

const router = express.Router();

router.use(protect);

// 1. Các tuyến đường điều trị lồng theo Patient Profile (Nested routes)
// GET /api/patient-profiles/:patientProfileId/treatments - Xem danh sách đợt điều trị của hồ sơ
// POST /api/patient-profiles/:patientProfileId/treatments - Thêm đợt điều trị mới (Chỉ Admin hoặc Nha sĩ)
router.route('/patient-profiles/:patientProfileId/treatments')
  .get(getTreatmentsByProfileId)
  .post(restrictTo(UserRole.ADMIN, UserRole.DENTIST), validate(createTreatmentHistorySchema), createTreatment);

// 2. Các tuyến đường truy cập trực tiếp đợt điều trị theo ID
// GET /api/treatment-histories/:id - Xem chi tiết đợt điều trị
// PATCH /api/treatment-histories/:id - Cập nhật đợt điều trị (Chỉ Admin hoặc Nha sĩ thực hiện điều trị đó)
// DELETE /api/treatment-histories/:id - Xóa đợt điều trị (Chỉ Admin)
router.route('/treatment-histories/:id')
  .get(getTreatmentDetail)
  .patch(validate(updateTreatmentHistorySchema), updateTreatment)
  .delete(restrictTo(UserRole.ADMIN), deleteTreatment);

export default router;
