import express from 'express';
import {
  getPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescriptionStatus,
  getDosageTemplates,
  createDosageTemplate,
  getUsageGuides,
  createUsageGuide,
} from '../controllers/prescriptionController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/dosage-templates', getDosageTemplates);
router.post('/dosage-templates', createDosageTemplate);

router.get('/usage-guides', getUsageGuides);
router.post('/usage-guides', createUsageGuide);

router.route('/')
  .get(getPrescriptions)
  .post(createPrescription);

router.route('/:id')
  .get(getPrescription);

router.patch('/:id/status', updatePrescriptionStatus);

export default router;
