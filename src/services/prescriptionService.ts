import crypto from 'crypto';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import { Prescription, PrescriptionItem, PatientProfile, User, Product, Appointment, TreatmentHistory } from '../models/index.js';
import { PrescriptionStatus, StockTransactionType, FREQUENCY_MULTIPLIER, AppointmentStatus, PatientStatus, InventoryCategory, type DosageFrequency } from '../constants/enums.js';
import { productRepository } from '../repositories/productRepository.js';
import { stockRepository } from '../repositories/stockRepository.js';
import AppError from '../utils/AppError.js';
import HttpStatus from '../constants/httpStatus.js';
import { getClinicToday } from '../utils/datetime.js';

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
    // excludeExpired: KHÔNG bao giờ cấp phát thuốc đã quá hạn cho bệnh nhân. Trước đây hàm này
    // chỉ lọc currentQty > 0, mà thứ tự FEFO lại là expiryDate ASC nên lô quá hạn lâu nhất
    // được ưu tiên xuất ĐẦU TIÊN.
    const batches = await stockRepository.findBatchesByProduct(productId, true, transaction, true);
    const totalStock = batches.reduce((sum, b) => sum + b.currentQty, 0);

    if (totalStock < quantity) {
      const product = await productRepository.findById(productId);
      // Phân biệt "hết hàng" với "chỉ còn hàng hết hạn" để người kê đơn biết đường xử lý.
      const allBatches = await stockRepository.findBatchesByProduct(productId, true, transaction);
      const expiredStock = allBatches.reduce((sum, b) => sum + b.currentQty, 0) - totalStock;
      const suffix = expiredStock > 0
        ? ` (còn ${expiredStock} đơn vị nhưng đã quá hạn sử dụng, không được cấp phát)`
        : '';
      throw new AppError(
        `Thuốc "${product?.name || productId}" không đủ tồn kho để cấp phát. Tồn khả dụng: ${totalStock}, yêu cầu: ${quantity}${suffix}`,
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
    const batch = await stockRepository.findBatchById(batchId, transaction);
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

/** Bỏ dấu tiếng Việt + hạ chữ thường để so khớp tên thuốc/hoạt chất với khai báo dị ứng. */
const normalizeForMatch = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

/**
 * Đối chiếu đơn thuốc với chống chỉ định ghi trong hồ sơ bệnh nhân.
 *
 * Hồ sơ đã lưu sẵn `allergies` và `isPregnant` nhưng trước đây không nơi nào đọc khi kê đơn —
 * kê đúng thứ thuốc bệnh nhân khai dị ứng vẫn lọt. Ở đây ta tách khai báo dị ứng thành từng
 * từ khóa (ngăn cách bởi dấu phẩy/chấm phẩy/xuống dòng) rồi so với tên thuốc và hoạt chất.
 *
 * Đây là lưới an toàn, không thay thế thẩm định của bác sĩ: bác sĩ vẫn có thể kê đè bằng cách
 * gửi kèm `overrideReason` — lý do đó được ghi vào ghi chú đơn để truy vết.
 */
const findClinicalContraindications = (
  profile: { allergies?: string | null; isPregnant?: boolean },
  products: Array<{ name: string; activeIngredient?: string | null; pregnancyContraindicated?: boolean }>,
): string[] => {
  const warnings: string[] = [];

  const allergyTerms = (profile.allergies || '')
    .split(/[,;\n\r/|]+/)
    .map((term) => normalizeForMatch(term))
    // Bỏ token quá ngắn để tránh khớp bừa (vd "da" khớp vào "Paracetamol")
    .filter((term) => term.length >= 3);

  for (const product of products) {
    const haystack = normalizeForMatch(`${product.name} ${product.activeIngredient || ''}`);

    for (const term of allergyTerms) {
      if (haystack.includes(term)) {
        warnings.push(`Bệnh nhân khai dị ứng "${term}" — trùng với thuốc "${product.name}"`);
        break;
      }
    }

    if (profile.isPregnant && product.pregnancyContraindicated) {
      warnings.push(`Bệnh nhân đang mang thai — thuốc "${product.name}" chống chỉ định với thai kỳ`);
    }
  }

  return warnings;
};

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
    // Không dùng cột lồng kiểu '$patientProfile.user.fullName$' ở đây: include `items` là
    // hasMany nên Sequelize bật subQuery, điều kiện bị đẩy vào truy vấn con vốn không join
    // hai bảng đó => MySQL báo "Unknown column 'patientProfile->user.fullName'" (lỗi 500).
    // Lọc bằng truy vấn con trên patientProfileId vừa chạy đúng vừa giữ nguyên phân trang.
    where[Op.or] = [
      { code: { [Op.like]: kw } },
      { diagnosis: { [Op.like]: kw } },
      {
        patientProfileId: {
          [Op.in]: sequelize.literal(
            `(SELECT pp.id FROM PatientProfiles pp INNER JOIN Users u ON u.id = pp.userId ` +
            `WHERE u.fullName LIKE ${sequelize.escape(kw)} OR u.phone LIKE ${sequelize.escape(kw)})`,
          ),
        },
      },
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
  /** Lý do bác sĩ vẫn kê dù có cảnh báo chống chỉ định (dị ứng / thai kỳ). */
  overrideReason?: string;
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
  // `patientProfileId` LUÔN là PatientProfile.id — không chấp nhận User.id thay thế.
  // Bản cũ dò cả hai (Op.or id/userId, rồi fallback sang userId), nên một id vừa khớp
  // PatientProfile.id của bệnh nhân A vừa khớp User.id của bệnh nhân B sẽ được resolve
  // theo thứ tự quét bảng của DB => kê đơn cho sai bệnh nhân. Route lồng
  // /patients/:id/prescriptions đã resolve sẵn qua patientService.resolvePatientProfileId.
  const targetProfileId = Number(String(data.patientProfileId ?? '').trim());
  if (!Number.isInteger(targetProfileId) || targetProfileId <= 0) {
    throw new AppError('Hồ sơ bệnh nhân không hợp lệ', HttpStatus.BAD_REQUEST);
  }

  const targetProfile = await PatientProfile.findByPk(targetProfileId);
  if (!targetProfile) {
    throw new AppError(
      'Không tìm thấy hồ sơ bệnh nhân (patientProfileId phải là ID hồ sơ bệnh án, không phải ID tài khoản người dùng)',
      HttpStatus.NOT_FOUND,
    );
  }

  if (targetProfile.status === PatientStatus.INACTIVE) {
    throw new AppError(
      'Hồ sơ bệnh nhân này đang ở trạng thái ngừng hoạt động, không thể kê đơn thuốc mới.',
      HttpStatus.BAD_REQUEST,
    );
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
    // Lịch hẹn phải là của chính bệnh nhân được kê đơn — Appointment tham chiếu Users.id còn
    // Prescription tham chiếu PatientProfiles.id, nếu không đối chiếu thì có thể kê đơn cho
    // bệnh nhân A nhưng gắn lịch hẹn của bệnh nhân B (sai hồ sơ, sai cả thống kê/hóa đơn).
    if (appointment.patientId !== targetProfile.userId) {
      throw new AppError(
        'Lịch hẹn được gắn không thuộc về bệnh nhân này',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Lần khám được gắn cũng phải thuộc đúng hồ sơ bệnh nhân đang kê đơn.
  let treatmentHistoryId = data.treatmentHistoryId || null;
  if (treatmentHistoryId) {
    const treatment = await TreatmentHistory.findByPk(treatmentHistoryId);
    if (!treatment) {
      throw new AppError('Lần khám liên kết không tồn tại', HttpStatus.NOT_FOUND);
    }
    if (treatment.patientProfileId !== targetProfileId) {
      throw new AppError('Lần khám được gắn không thuộc về bệnh nhân này', HttpStatus.BAD_REQUEST);
    }
  } else if (data.appointmentId) {
    // Kê đơn từ màn hình lịch hẹn: tự gắn vào lần khám mà lịch hẹn đó đã sinh ra, để đơn
    // thuốc hiện đúng trong chi tiết lần khám thay vì treo lơ lửng ngoài hồ sơ.
    const visit = await TreatmentHistory.findOne({ where: { appointmentId: data.appointmentId } });
    if (visit) treatmentHistoryId = visit.id;
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
    // Đơn thuốc chỉ được chứa THUỐC. Kho còn chứa găng tay, khẩu trang, kim tiêm, vật tư nha
    // khoa — trước đây các mặt hàng này kê vào đơn thuốc vẫn lọt và bị trừ kho theo đường cấp
    // phát thuốc, làm sai cả đơn in cho bệnh nhân lẫn sổ xuất kho.
    if (product.category !== InventoryCategory.MEDICINE) {
      throw new AppError(
        `"${product.name}" là vật tư/thiết bị, không phải thuốc — không thể kê vào đơn thuốc`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Đối chiếu chống chỉ định với hồ sơ bệnh nhân trước khi cho phép kê.
  const contraindications = findClinicalContraindications(
    targetProfile,
    uniqueProductIds.map((id) => productById.get(id)),
  );
  const overrideReason = data.overrideReason?.trim();
  if (contraindications.length > 0 && !overrideReason) {
    throw new AppError(
      `Đơn thuốc có chống chỉ định với hồ sơ bệnh nhân:\n- ${contraindications.join('\n- ')}\n` +
      'Nếu vẫn quyết định kê, vui lòng gửi kèm lý do (overrideReason).',
      HttpStatus.BAD_REQUEST,
    );
  }

  // Ghi lý do kê đè vào ghi chú đơn để hồ sơ còn dấu vết cảnh báo đã bị bỏ qua.
  let finalNotes = data.notes || null;
  if (contraindications.length > 0 && overrideReason) {
    const overrideNote =
      `[Kê đè cảnh báo chống chỉ định] ${contraindications.join('; ')}. Lý do: ${overrideReason}`;
    finalNotes = finalNotes ? `${finalNotes}\n${overrideNote}` : overrideNote;
  }

  const status = data.status || PrescriptionStatus.CONFIRMED;

  // Generate collision-free code e.g. RX-20260728-A1B2C3
  // Theo giờ phòng khám: dùng UTC thì đơn kê lúc 0h-7h sáng mang mã của ngày hôm trước.
  const dateStr = getClinicToday().replace(/-/g, '');
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  const code = `RX-${dateStr}-${randomHex}`;

  const createdId = await sequelize.transaction(async (t) => {
    const prescription = await Prescription.create({
      code,
      patientProfileId: targetProfileId,
      dentistId: data.dentistId,
      appointmentId: data.appointmentId || null,
      treatmentHistoryId,
      diagnosis: data.diagnosis,
      notes: finalNotes,
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
