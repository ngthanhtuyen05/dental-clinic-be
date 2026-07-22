import express from 'express';
import {
  getAppointments,
  createAppointment,
  getAppointment,
  updateAppointment,
  updateAppointmentStatus,
  getTodayStats,
  getAvailableSlots,
} from '../controllers/appointmentController.js';
import { validate } from '../middlewares/validate.js';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
} from '../validations/appointmentValidation.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Yêu cầu đăng nhập cho toàn bộ API Lịch hẹn
router.use(protect);

// Các route tĩnh cần đặt trước route động /:id
router.get('/today-stats', getTodayStats);
router.get('/available-slots', getAvailableSlots);

router.route('/')
  .get(getAppointments)
  .post(validate(createAppointmentSchema), createAppointment);

router.route('/:id')
  .get(getAppointment)
  .patch(validate(updateAppointmentSchema), updateAppointment);

router.patch('/:id/status', validate(updateAppointmentStatusSchema), updateAppointmentStatus);

export default router;
