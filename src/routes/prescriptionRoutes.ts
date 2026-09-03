import express from 'express';
import {
  getPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescriptionStatus,
  getDosageTemplates,
  getDosageTemplate,
  createDosageTemplate,
  updateDosageTemplate,
  deleteDosageTemplate,
  getUsageGuides,
  createUsageGuide,
} from '../controllers/prescriptionController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { checkPermission } from '../middlewares/permissionMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/dosage-templates', checkPermission('prescriptions.view'), getDosageTemplates);
router.post('/dosage-templates', checkPermission('prescriptions.templates'), createDosageTemplate);
router.get('/dosage-templates/:id', checkPermission('prescriptions.view'), getDosageTemplate);
router.put('/dosage-templates/:id', checkPermission('prescriptions.templates'), updateDosageTemplate);
router.patch('/dosage-templates/:id', checkPermission('prescriptions.templates'), updateDosageTemplate);
router.delete('/dosage-templates/:id', checkPermission('prescriptions.templates'), deleteDosageTemplate);

router.get('/usage-guides', checkPermission('prescriptions.view'), getUsageGuides);
router.post('/usage-guides', checkPermission('prescriptions.templates'), createUsageGuide);

router.route('/')
  .get(checkPermission('prescriptions.view'), getPrescriptions)
  .post(checkPermission('prescriptions.create'), createPrescription);

router.route('/:id')
  .get(checkPermission('prescriptions.view'), getPrescription);

router.patch('/:id/status', checkPermission('prescriptions.edit'), updatePrescriptionStatus);

export default router;
