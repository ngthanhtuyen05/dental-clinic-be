import express from 'express';
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  togglePatientStatus,
  importPatients,
  getPatientPrescriptions,
  createPatientPrescription,
  getPatientVisits,
  getPatientVisitDetail,
  getPatientOdontogram,
  updatePatientOdontogram,
} from '../controllers/patientController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { checkPermission } from '../middlewares/permissionMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { createPatientSchema, updatePatientSchema, updateOdontogramSchema } from '../validations/patientValidation.js';
import { createPatientPrescriptionSchema } from '../validations/prescriptionValidation.js';

const router = express.Router();

router.use(protect);

router.post('/import', checkPermission('patients.create'), importPatients);

router.route('/')
  .get(checkPermission('patients.view'), getPatients)
  .post(checkPermission('patients.create'), validate(createPatientSchema), createPatient);

router.route('/:id/prescriptions')
  .get(checkPermission('prescriptions.view'), getPatientPrescriptions)
  .post(checkPermission('prescriptions.create'), validate(createPatientPrescriptionSchema), createPatientPrescription);

router.route('/:id/visits')
  .get(checkPermission('patients.view'), getPatientVisits);

router.route('/:id/visits/:visitId')
  .get(checkPermission('patients.view'), getPatientVisitDetail);

router.route('/:id/odontogram')
  .get(checkPermission('patients.view'), getPatientOdontogram)
  .put(checkPermission('patients.edit'), validate(updateOdontogramSchema), updatePatientOdontogram);

router.route('/:id')
  .get(checkPermission('patients.view'), getPatient)
  .patch(checkPermission('patients.edit'), validate(updatePatientSchema), updatePatient)
  .delete(checkPermission('patients.delete'), deletePatient);

router.route('/:id/toggle-status')
  .patch(checkPermission('patients.edit'), togglePatientStatus);

export default router;
