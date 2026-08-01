import express from 'express';
import {
  getAppointments,
  createAppointment,
  getAppointment,
  updateAppointment,
  updateAppointmentStatus,
  getTodayStats,
  getAvailableSlots,
  getMyAppointments,
} from '../controllers/appointmentController.js';
import { validate } from '../middlewares/validate.js';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
} from '../validations/appointmentValidation.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ── Public Routes (Khách xem lịch trống) ──
router.get('/available-slots', getAvailableSlots);

// ── Protected Routes (Bắt buộc đăng nhập tài khoản) ──
router.use(protect);

router.get('/my-appointments', getMyAppointments);
router.post('/', validate(createAppointmentSchema), createAppointment);
router.get('/today-stats', getTodayStats);
router.get('/', getAppointments);

router.route('/:id')
  .get(getAppointment)
  .patch(validate(updateAppointmentSchema), updateAppointment);

router.patch('/:id/status', validate(updateAppointmentStatusSchema), updateAppointmentStatus);

export default router;
