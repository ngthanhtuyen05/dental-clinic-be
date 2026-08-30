import express from 'express';
import { getPatients, getPatient, createPatient, updatePatient, deletePatient, togglePatientStatus, importPatients } from '../controllers/patientController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { checkPermission } from '../middlewares/permissionMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { createPatientSchema, updatePatientSchema } from '../validations/patientValidation.js';

const router = express.Router();

router.use(protect);

router.post('/import', checkPermission('patients.create'), importPatients);

router.route('/')
  .get(checkPermission('patients.view'), getPatients)
  .post(checkPermission('patients.create'), validate(createPatientSchema), createPatient);

router.route('/:id')
  .get(checkPermission('patients.view'), getPatient)
  .patch(checkPermission('patients.edit'), validate(updatePatientSchema), updatePatient)
  .delete(checkPermission('patients.delete'), deletePatient);

router.route('/:id/toggle-status')
  .patch(checkPermission('patients.edit'), togglePatientStatus);

export default router;
