import express from 'express';
import userRoutes from './userRoutes.js';
import authRoutes from './authRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import patientProfileRoutes from './patientProfileRoutes.js';
import treatmentHistoryRoutes from './treatmentHistoryRoutes.js';
import patientRoutes from './patientRoutes.js';
import serviceRoutes from './serviceRoutes.js';
import staffRoutes from './staffRoutes.js';
import specialtyRoutes from './specialtyRoutes.js';
import supplierRoutes from './supplierRoutes.js';
import productRoutes from './productRoutes.js';
import stockRoutes from './stockRoutes.js';
import prescriptionRoutes from './prescriptionRoutes.js';
import invoiceRoutes from './invoiceRoutes.js';
import roleRoutes from './roleRoutes.js';

const router = express.Router();

// Route test của /api
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is healthy and running',
  });
});

// Auth routes — giữ backward compat tại /api/users/login|register|...
// Đồng thời mount tại /api/auth cho clean path
router.use('/auth', authRoutes);
router.use('/users', authRoutes); // backward compat: /api/users/login vẫn hoạt động
router.use('/users', userRoutes);

// Domain routes
router.use('/appointments', appointmentRoutes);
router.use('/patient-profiles', patientProfileRoutes);
router.use('/patients', patientRoutes);
router.use('/services', serviceRoutes);
router.use('/staff', staffRoutes);
router.use('/roles', roleRoutes);
router.use('/specialties', specialtyRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/products', productRoutes);
router.use('/stock', stockRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/', treatmentHistoryRoutes);

export default router;
