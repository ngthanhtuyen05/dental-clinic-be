import crypto from 'crypto';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import { Prescription, PrescriptionItem, PatientProfile, User, Product, Appointment } from '../models/index.js';
import { PrescriptionStatus, StockTransactionType, FREQUENCY_MULTIPLIER, AppointmentStatus, type DosageFrequency } from '../constants/enums.js';
import { productRepository } from '../repositories/productRepository.js';
import { stockRepository } from '../repositories/stockRepository.js';
import AppError from '../utils/AppError.js';
import HttpStatus from '../constants/httpStatus.js';

/** Các trạng thái đơn thuốc được phép chuyển tới từ mỗi trạng thái hiện tại. */
const ALLOWED_STATUS_TRANSITIONS: Record<PrescriptionStatus, PrescriptionStatus[]> = {
  [PrescriptionStatus.DRAFT]: [PrescriptionStatus.CONFIRMED, PrescriptionStatus.CANCELLED],
  [PrescriptionStatus.CONFIRMED]: [PrescriptionStatus.CANCELLED],
  [PrescriptionStatus.CANCELLED]: [],
};

/**
 * Xuất kho thuốc theo FEFO (lô cận date/nhập trước xuất trước) cho các item của đơn thuốc,
 * trong cùng 1 transaction với thao tác tạo/xác nhận đơn — nếu không đủ tồn kho sẽ rollback
 * toàn bộ (không tạo/không xác nhận đơn với thuốc không thể cấp phát được).
 */
const consumePrescriptionStock = async (
  prescriptionId: number,
  items: Array<{ productId: number; totalQuantity: number }>,
  performedBy: number,
  transaction: any,
  reason: string,
) => {
  // Gộp số lượng theo sản phẩm (phòng trường hợp 1 đơn kê trùng 1 thuốc ở nhiều dòng)
  const quantityByProduct = new Map<number, number>();
  for (const item of items) {
    quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) || 0) + item.totalQuantity);
  }

  for (const [productId, quantity] of quantityByProduct.entries()) {
    const batches = await stockRepository.findBatchesByProduct(productId, true);
    const totalStock = batches.reduce((sum, b) => sum + b.currentQty, 0);

    if (totalStock < quantity) {
      const product = await productRepository.findById(productId);
      throw new AppError(
        `Thuốc "${product?.name || productId}" không đủ tồn kho để cấp phát. Tồn hiện tại: ${totalStock}, yêu cầu: ${quantity}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    let remaining = quantity;
    for (const batch of batches) {
      if (remaining <= 0) break;
      const take = Math.min(batch.currentQty, remaining);
      await batch.decrement('currentQty', { by: take, transaction });
      await stockRepository.createTransaction({
        productId,
        batchId: batch.id,
        type: StockTransactionType.TREATMENT,
        quantity: take,
        performedBy,
        prescriptionId,
        reason: `${reason} (Lô ${batch.batchNumber})`,
      }, transaction);
      remaining -= take;
    }
  }
};

/**
 * Hoàn lại tồn kho đã trừ cho 1 đơn thuốc khi đơn CONFIRMED bị hủy — trả đúng số lượng
 * về đúng lô đã xuất trước đó (dựa trên các StockTransaction loại TREATMENT đã ghi nhận
 * khi cấp phát), ghi nhận 1 giao dịch ADJUSTMENT hoàn kho tương ứng.
 */
const restockPrescriptionStock = async (
  prescriptionId: number,
  performedBy: number,
  transaction: any,
  reason: string,
) => {
  const consumed = await stockRepository.getConsumedByPrescription(prescriptionId, transaction);

  for (const { batchId, productId, totalQuantity } of consumed) {
    if (!batchId || totalQuantity <= 0) continue;
    const batch = await stockRepository.findBatchById(batchId);
    if (!batch) continue;

    await batch.increment('currentQty', { by: totalQuantity, transaction });
    await stockRepository.createTransaction({
      productId,
      batchId,
      type: StockTransactionType.ADJUSTMENT,
      quantity: totalQuantity,
      performedBy,
      prescriptionId,
      reason: `${reason} (Lô ${batch.batchNumber})`,
    }, transaction);
  }
};

// Re-export tất cả hàm của DosageTemplate và UsageGuide từ service riêng biệt
export * from './dosageTemplateService.js';
export * from './usageGuideService.js';

export const getPrescriptions = async (params: {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  patientProfileId?: number;
  appointmentId?: number;
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

  if (params.appointmentId) {
    where.appointmentId = params.appointmentId;
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
      { '$patientProfile.user.fullName$': { [Op.like]: kw } },
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
            attributes: ['id', 'code', 'name', 'unit', 'sellingPrice'],
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
            attributes: ['id', 'code', 'name', 'unit', 'sellingPrice'],
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

  if (!data.items || data.items.length === 0) {
    throw new AppError('Đơn thuốc phải có ít nhất 1 loại thuốc', HttpStatus.BAD_REQUEST);
  }

  // Chỉ cho phép gắn đơn thuốc với lịch hẹn đang khám hoặc đã khám xong — khớp với
  // ràng buộc phía FE (nút "Kê đơn thuốc" chỉ hiện khi IN_PROGRESS/COMPLETED), tránh
  // trường hợp kê đơn qua route/API trực tiếp cho lịch hẹn chưa diễn ra hoặc đã hủy.
  if (data.appointmentId) {
    const appointment = await Appointment.findByPk(data.appointmentId);
    if (!appointment) {
      throw new AppError('Lịch hẹn liên kết không tồn tại', HttpStatus.NOT_FOUND);
    }
    const allowedAppointmentStatuses = [AppointmentStatus.IN_PROGRESS, AppointmentStatus.COMPLETED];
    if (!allowedAppointmentStatuses.includes(appointment.status)) {
      throw new AppError(
        'Chỉ có thể kê đơn thuốc cho lịch hẹn đang khám hoặc đã khám xong',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Validate sản phẩm tồn tại, đang active, và không kê trùng thuốc trong cùng 1 đơn
  // (1 query duy nhất thay vì gọi findById cho từng dòng, tránh N+1 khi đơn có nhiều thuốc)
  const uniqueProductIds = [...new Set(data.items.map((item) => item.productId))];
  if (uniqueProductIds.length !== data.items.length) {
    throw new AppError('Đơn thuốc bị kê trùng thuốc ở nhiều dòng khác nhau', HttpStatus.BAD_REQUEST);
  }

  const products = await productRepository.findByIds(uniqueProductIds);
  const productById = new Map(products.map((p: any) => [p.id, p]));
  for (const productId of uniqueProductIds) {
    const product = productById.get(productId);
    if (!product) {
      throw new AppError(`Thuốc với ID ${productId} không tồn tại`, HttpStatus.NOT_FOUND);
    }
    if (!product.isActive) {
      throw new AppError(`Thuốc "${product.name}" đã ngừng kinh doanh, không thể kê đơn`, HttpStatus.BAD_REQUEST);
    }
  }

  const status = data.status || PrescriptionStatus.CONFIRMED;

  // Generate collision-free code e.g. RX-20260728-A1B2C3
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  const code = `RX-${dateStr}-${randomHex}`;

  const createdId = await sequelize.transaction(async (t) => {
    const prescription = await Prescription.create({
      code,
      patientProfileId: targetProfileId,
      dentistId: data.dentistId,
      appointmentId: data.appointmentId || null,
      treatmentHistoryId: data.treatmentHistoryId || null,
      diagnosis: data.diagnosis,
      notes: data.notes || null,
      status,
      prescribedAt: new Date(),
    }, { transaction: t });

    // Không tin totalQuantity client gửi lên — luôn tính lại theo công thức
    const itemsToCreate = data.items.map((item) => {
      const multiplier = FREQUENCY_MULTIPLIER[item.frequency as DosageFrequency] || 1;
      const quantityPerDose = item.quantityPerDose || 1;
      const durationDays = item.durationDays || 5;
      return {
        prescriptionId: prescription.id,
        productId: item.productId,
        dosageTemplateId: item.dosageTemplateId || null,
        dosageText: item.dosageText,
        quantityPerDose,
        frequency: item.frequency as any,
        durationDays,
        totalQuantity: quantityPerDose * multiplier * durationDays,
        mealRelation: item.mealRelation as any,
        usageInstruction: item.usageInstruction || null,
        warnings: item.warnings || null,
      };
    });
    await PrescriptionItem.bulkCreate(itemsToCreate, { transaction: t });

    // Đơn ở trạng thái CONFIRMED nghĩa là thuốc được cấp phát ngay -> trừ kho luôn
    if (status === PrescriptionStatus.CONFIRMED) {
      await consumePrescriptionStock(
        prescription.id,
        itemsToCreate.map((i) => ({ productId: i.productId, totalQuantity: i.totalQuantity })),
        data.dentistId,
        t,
        `Cấp phát theo đơn thuốc ${code}`,
      );
    }

    return prescription.id;
  });

  return getPrescriptionById(createdId);
};

export const updatePrescriptionStatus = async (id: number, status: PrescriptionStatus, performedBy: number) => {
  const prescription = await Prescription.findByPk(id, {
    include: [{ model: PrescriptionItem, as: 'items' }],
  });
  if (!prescription) {
    throw new AppError('Không tìm thấy đơn thuốc', HttpStatus.NOT_FOUND);
  }

  const currentStatus = prescription.status as PrescriptionStatus;
  if (currentStatus === status) {
    throw new AppError(`Đơn thuốc đã ở trạng thái này`, HttpStatus.BAD_REQUEST);
  }
  const allowedNext = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(status)) {
    throw new AppError(
      `Không thể chuyển đơn thuốc từ trạng thái "${currentStatus}" sang "${status}"`,
      HttpStatus.BAD_REQUEST,
    );
  }

  await sequelize.transaction(async (t) => {
    // Xác nhận đơn nháp -> cấp phát thuốc, cần trừ kho tại thời điểm này
    if (currentStatus === PrescriptionStatus.DRAFT && status === PrescriptionStatus.CONFIRMED) {
      const items = ((prescription as any).items || []) as Array<{ productId: number; totalQuantity: number }>;
      await consumePrescriptionStock(prescription.id, items, performedBy, t, `Cấp phát theo đơn thuốc ${prescription.code}`);
    }

    // Hủy đơn đã xác nhận (đã trừ kho) -> hoàn lại đúng số lượng/lô đã cấp phát
    if (currentStatus === PrescriptionStatus.CONFIRMED && status === PrescriptionStatus.CANCELLED) {
      await restockPrescriptionStock(prescription.id, performedBy, t, `Hoàn kho do hủy đơn thuốc ${prescription.code}`);
    }

    prescription.status = status;
    await prescription.save({ transaction: t });
  });

  return getPrescriptionById(id);
};
