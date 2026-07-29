import { Op } from 'sequelize';
import { Prescription, PrescriptionItem, PatientProfile, User, Product, DosageTemplate, UsageGuide } from '../models/index.js';
import { PrescriptionStatus } from '../constants/enums.js';
import AppError from '../utils/AppError.js';
import HttpStatus from '../constants/httpStatus.js';

export const getPrescriptions = async (params: {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  patientProfileId?: number;
}) => {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const offset = (page - 1) * limit;

  const where: any = {};

  if (params.status && params.status !== 'all') {
    where.status = params.status;
  }

  if (params.patientProfileId) {
    where.patientProfileId = params.patientProfileId;
  }

  if (params.startDate && params.endDate) {
    where.prescribedAt = {
      [Op.between]: [
        new Date(`${params.startDate}T00:00:00.000Z`),
        new Date(`${params.endDate}T23:59:59.999Z`),
      ],
    };
  } else if (params.startDate) {
    where.prescribedAt = { [Op.gte]: new Date(`${params.startDate}T00:00:00.000Z`) };
  } else if (params.endDate) {
    where.prescribedAt = { [Op.lte]: new Date(`${params.endDate}T23:59:59.999Z`) };
  }

  if (params.keyword) {
    const kw = `%${params.keyword.trim()}%`;
    where[Op.or] = [
      { code: { [Op.like]: kw } },
      { diagnosis: { [Op.like]: kw } },
      { '$patientProfile.fullName$': { [Op.like]: kw } },
    ];
  }

  const { rows: prescriptions, count: total } = await Prescription.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    distinct: true,
    include: [
      {
        model: PatientProfile,
        as: 'patientProfile',
        attributes: ['id', 'dateOfBirth'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'phone'],
          },
        ],
      },
      {
        model: User,
        as: 'dentist',
        attributes: ['id', 'fullName'],
      },
      {
        model: PrescriptionItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'code', 'name', 'unit'],
          },
        ],
      },
    ],
  });

  // Map response to match frontend interface expectation
  const data = prescriptions.map((p) => {
    const plain = p.get({ plain: true });
    return {
      ...plain,
      patient: {
        id: plain.patientProfile?.id,
        fullName: plain.patientProfile?.user?.fullName || '—',
        phone: plain.patientProfile?.user?.phone || '—',
        dateOfBirth: plain.patientProfile?.dateOfBirth,
      },
    };
  });

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPrescriptionById = async (id: number) => {
  const prescription = await Prescription.findByPk(id, {
    include: [
      {
        model: PatientProfile,
        as: 'patientProfile',
        attributes: ['id', 'dateOfBirth'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'phone'],
          },
        ],
      },
      {
        model: User,
        as: 'dentist',
        attributes: ['id', 'fullName'],
      },
      {
        model: PrescriptionItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'code', 'name', 'unit'],
          },
        ],
      },
    ],
  });

  if (!prescription) {
    throw new AppError('Không tìm thấy đơn thuốc', HttpStatus.NOT_FOUND);
  }

  const plain = prescription.get({ plain: true });
  return {
    ...plain,
    patient: {
      id: plain.patientProfile?.id,
      fullName: plain.patientProfile?.user?.fullName || '—',
      phone: plain.patientProfile?.user?.phone || '—',
      dateOfBirth: plain.patientProfile?.dateOfBirth,
    },
  };
};

export const createPrescription = async (data: {
  patientProfileId: number | string;
  dentistId: number;
  appointmentId?: number;
  treatmentHistoryId?: number;
  diagnosis: string;
  notes?: string;
  status?: PrescriptionStatus;
  items: Array<{
    productId: number;
    dosageTemplateId?: number;
    dosageText: string;
    quantityPerDose: number;
    frequency: string;
    durationDays: number;
    totalQuantity: number;
    mealRelation: string;
    usageInstruction?: string;
    warnings?: string;
  }>;
}) => {
  // Resolve numeric patientProfileId
  let targetProfileId = Number(data.patientProfileId);
  if (isNaN(targetProfileId) || !targetProfileId) {
    if (typeof data.patientProfileId === 'string') {
      const numericStr = (data.patientProfileId as string).replace(/\D/g, '');
      const num = parseInt(numericStr, 10);
      if (!isNaN(num)) {
        const profile = await PatientProfile.findOne({
          where: {
            [Op.or]: [{ id: num }, { userId: num }],
          },
        });
        targetProfileId = profile ? profile.id : num;
      }
    }
  } else {
    const profileById = await PatientProfile.findByPk(targetProfileId);
    if (!profileById) {
      const profileByUserId = await PatientProfile.findOne({ where: { userId: targetProfileId } });
      if (profileByUserId) {
        targetProfileId = profileByUserId.id;
      }
    }
  }

  if (!targetProfileId || isNaN(targetProfileId)) {
    throw new AppError('Hồ sơ bệnh nhân không hợp lệ', HttpStatus.BAD_REQUEST);
  }

  // Generate code e.g. RX-20260728-001
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const countToday = await Prescription.count();
  const sequence = String(countToday + 1).padStart(3, '0');
  const code = `RX-${dateStr}-${sequence}`;

  const prescription = await Prescription.create({
    code,
    patientProfileId: targetProfileId,
    dentistId: data.dentistId,
    appointmentId: data.appointmentId || null,
    treatmentHistoryId: data.treatmentHistoryId || null,
    diagnosis: data.diagnosis,
    notes: data.notes || null,
    status: data.status || PrescriptionStatus.CONFIRMED,
    prescribedAt: new Date(),
  });

  if (data.items && data.items.length > 0) {
    const itemsToCreate = data.items.map((item) => ({
      prescriptionId: prescription.id,
      productId: item.productId,
      dosageTemplateId: item.dosageTemplateId || null,
      dosageText: item.dosageText,
      quantityPerDose: item.quantityPerDose || 1,
      frequency: item.frequency as any,
      durationDays: item.durationDays || 5,
      totalQuantity: item.totalQuantity,
      mealRelation: item.mealRelation as any,
      usageInstruction: item.usageInstruction || null,
      warnings: item.warnings || null,
    }));
    await PrescriptionItem.bulkCreate(itemsToCreate);
  }

  return getPrescriptionById(prescription.id);
};

export const updatePrescriptionStatus = async (id: number, status: PrescriptionStatus) => {
  const prescription = await Prescription.findByPk(id);
  if (!prescription) {
    throw new AppError('Không tìm thấy đơn thuốc', HttpStatus.NOT_FOUND);
  }

  prescription.status = status;
  await prescription.save();

  return getPrescriptionById(id);
};

export const getDosageTemplates = async (keyword?: string) => {
  const where: any = { isActive: true };
  if (keyword && keyword.trim()) {
    const kw = `%${keyword.trim()}%`;
    where[Op.or] = [
      { name: { [Op.like]: kw } },
      { instruction: { [Op.like]: kw } },
    ];
  }
  return DosageTemplate.findAll({
    where,
    order: [['createdAt', 'DESC']],
  });
};

export const createDosageTemplate = async (data: any) => {
  return DosageTemplate.create(data);
};

export const getUsageGuides = async (keyword?: string) => {
  const where: any = { isActive: true };
  if (keyword && keyword.trim()) {
    const kw = `%${keyword.trim()}%`;
    where[Op.or] = [
      { title: { [Op.like]: kw } },
      { category: { [Op.like]: kw } },
      { content: { [Op.like]: kw } },
    ];
  }
  return UsageGuide.findAll({
    where,
    order: [['createdAt', 'DESC']],
  });
};

export const createUsageGuide = async (data: any) => {
  return UsageGuide.create(data);
};
