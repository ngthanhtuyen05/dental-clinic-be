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
import { protect, AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { checkPermission } from '../middlewares/permissionMiddleware.js';
import { appointmentRepository } from '../repositories/appointmentRepository.js';
import { AppointmentStatus, UserRole } from '../constants/enums.js';
import { Response, NextFunction } from 'express';

const router = express.Router();

// Middleware: Cho phép bệnh nhân hủy lịch của chính mình, hoặc nhân sự có quyền hủy/đổi trạng thái
const allowOwnerCancelOrStaffStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id as string, 10);
  if (req.user) {
    if (req.user.role === UserRole.ADMIN) return next();
    if (req.body?.status === AppointmentStatus.CANCELLED) {
      const appt = await appointmentRepository.findById(id);
      if (appt && appt.patientId === req.user.id) {
        return next();
      }
    }
  }
  return checkPermission(['appointments.edit', 'appointments.cancel'])(req, res, next);
};

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

router.patch('/:id/status', allowOwnerCancelOrStaffStatus, validate(updateAppointmentStatusSchema), updateAppointmentStatus);

export default router;
