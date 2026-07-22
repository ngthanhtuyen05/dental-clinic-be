import express from 'express';
import { getPatients, getPatient, createPatient, updatePatient, deletePatient, togglePatientStatus } from '../controllers/patientController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { createPatientSchema, updatePatientSchema } from '../validations/patientValidation.js';
import { UserRole } from '../constants/enums.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(restrictTo(UserRole.ADMIN, UserRole.DENTIST, UserRole.STAFF), getPatients)
  .post(restrictTo(UserRole.ADMIN, UserRole.DENTIST, UserRole.STAFF), validate(createPatientSchema), createPatient);

router.route('/:id')
  .get(restrictTo(UserRole.ADMIN, UserRole.DENTIST, UserRole.STAFF), getPatient)
  .patch(restrictTo(UserRole.ADMIN, UserRole.DENTIST, UserRole.STAFF), validate(updatePatientSchema), updatePatient)
  .delete(restrictTo(UserRole.ADMIN), deletePatient);

router.route('/:id/toggle-status')
  .patch(restrictTo(UserRole.ADMIN, UserRole.STAFF), togglePatientStatus);

export default router;
