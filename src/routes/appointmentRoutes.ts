import express from 'express';
import { getAppointments, createAppointment } from '../controllers/appointmentController.js';
import { validate } from '../middlewares/validate.js';
import { createAppointmentSchema } from '../validations/appointmentValidation.js';

import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Tất cả các lịch hẹn yêu cầu đăng nhập trước khi thực hiện
router.use(protect);

router.route('/')
  .get(getAppointments)
  .post(validate(createAppointmentSchema), createAppointment);

export default router;

