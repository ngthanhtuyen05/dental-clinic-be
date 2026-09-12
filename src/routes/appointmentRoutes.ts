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
import AppError from '../utils/AppError.js';
import HttpStatus from '../constants/httpStatus.js';

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

/**
 * Đặt lịch hẹn: bệnh nhân chỉ được đặt cho CHÍNH MÌNH, nhân sự phòng khám cần quyền
 * `appointments.create`. Trước đây route này chỉ có `protect`, nên bất kỳ tài khoản nào
 * đăng nhập cũng đặt được lịch cho bệnh nhân khác (hoặc tạo tài khoản bệnh nhân mới qua
 * nhánh khách vãng lai) mà không cần quyền gì.
 */
const allowSelfBookingOrStaffCreate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Vui lòng đăng nhập để đặt lịch hẹn.', HttpStatus.UNAUTHORIZED));
  }

  if (req.user.role === UserRole.PATIENT) {
    // Ép về chính chủ và loại bỏ thông tin bệnh nhân khác do client gửi lên, tránh việc
    // bệnh nhân tự khai phone/email của người khác để đặt hộ hoặc tạo hồ sơ mới.
    req.body.patientId = req.user.id;
    delete req.body.fullName;
    delete req.body.phone;
    delete req.body.email;
    return next();
  }

  return checkPermission('appointments.create')(req, res, next);
};

// ── Public Routes (Khách xem lịch trống) ──
router.get('/available-slots', getAvailableSlots);

// ── Protected Routes (Bắt buộc đăng nhập tài khoản) ──
router.use(protect);

router.get('/my-appointments', getMyAppointments);
router.post('/', allowSelfBookingOrStaffCreate, validate(createAppointmentSchema), createAppointment);
router.get('/today-stats', checkPermission('appointments.view'), getTodayStats);
router.get('/', checkPermission('appointments.view'), getAppointments);

router.route('/:id')
  .get(checkPermission('appointments.view'), getAppointment)
  .patch(checkPermission('appointments.edit'), validate(updateAppointmentSchema), updateAppointment);

router.patch('/:id/status', allowOwnerCancelOrStaffStatus, validate(updateAppointmentStatusSchema), updateAppointmentStatus);

export default router;
