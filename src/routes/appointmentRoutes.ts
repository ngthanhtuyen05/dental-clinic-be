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
import { checkPermission } from '../middlewares/permissionMiddleware.js';

const router = express.Router();

// ── Public Routes (Khách xem lịch trống) ──
router.get('/available-slots', getAvailableSlots);

// ── Protected Routes (Bắt buộc đăng nhập tài khoản) ──
router.use(protect);

router.get('/my-appointments', getMyAppointments);
router.post('/', validate(createAppointmentSchema), createAppointment);
router.get('/today-stats', checkPermission('appointments.view'), getTodayStats);
router.get('/', checkPermission('appointments.view'), getAppointments);

router.route('/:id')
  .get(checkPermission('appointments.view'), getAppointment)
  .patch(checkPermission('appointments.edit'), validate(updateAppointmentSchema), updateAppointment);

router.patch('/:id/status', checkPermission(['appointments.edit', 'appointments.cancel']), validate(updateAppointmentStatusSchema), updateAppointmentStatus);

export default router;
