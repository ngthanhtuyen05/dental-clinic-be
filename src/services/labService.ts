import { labRepository, LabOrderFilterOptions } from '../repositories/labRepository.js';
import { Supplier, User, PatientProfile, StaffProfile } from '../models/index.js';
import AppError from '../utils/AppError.js';
import HttpStatus from '../constants/httpStatus.js';

export const formatLabOrderResponse = (order: any) => {
  if (!order) return null;
  const json = order.toJSON ? order.toJSON() : order;

  const patient = json.patientProfile?.user || {};
  const dentist = json.dentist || {};
  const supplier = json.supplier || {};

  return {
    ...json,
    patientName: patient.fullName || json.patientName || 'Bệnh nhân',
    patientPhone: patient.phone || json.patientPhone || '',
    patientGender: json.patientProfile?.gender || json.patientGender || undefined,
    dentistName: dentist.fullName || json.dentistName || 'Bác sĩ',
    supplierName: supplier.name || json.supplierName || 'Xưởng Labo',
    supplierPhone: supplier.phone || '',
    supplierAddress: supplier.address || '',
    teethNumbers: Array.isArray(json.teethNumbers) ? json.teethNumbers : [],
    unitCostPrice: Number(json.unitCostPrice || 0),
    totalCostPrice: Number(json.totalCostPrice || 0),
    isPaidToLab: Boolean(json.isPaidToLab),
  };
};

export const formatWarrantyCardResponse = (card: any) => {
  if (!card) return null;
  const json = card.toJSON ? card.toJSON() : card;

  const patient = json.patientProfile?.user || {};
  const dentist = json.labOrder?.dentist || {};
  const supplier = json.labOrder?.supplier || {};

  return {
    ...json,
    patientFullName: patient.fullName || json.patientFullName || 'Bệnh nhân',
    patientPhone: patient.phone || json.patientPhone || '',
    labOrderCode: json.labOrder?.code || json.labOrderCode || '',
    dentistName: dentist.fullName || json.dentistName || '',
    supplierName: supplier.name || json.supplierName || '',
  };
};

export const getAllOrders = async (filters: LabOrderFilterOptions) => {
  const result = await labRepository.findAllOrders(filters);
  const formattedData = result.orders.map((o) => formatLabOrderResponse(o));
  const stats = await labRepository.getOrderStats();

  return {
    data: formattedData,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
    stats,
  };
};

export const getOrderById = async (id: number) => {
  const order = await labRepository.findOrderById(id);
  if (!order) {
    throw new AppError(`Không tìm thấy đơn hàng Labo #${id}`, HttpStatus.NOT_FOUND);
  }
  return formatLabOrderResponse(order);
};

export const createOrder = async (data: any, createdBy?: number, creatorName: string = 'Hệ thống') => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  const code = `LAB-${dateStr}-${rand}`;

  let patientProfileId = Number(data.patientProfileId);
  const profile = await PatientProfile.findByPk(patientProfileId);
  if (!profile) {
    const profileByUserId = await PatientProfile.findOne({ where: { userId: patientProfileId } });
    if (profileByUserId) {
      patientProfileId = profileByUserId.id;
    }
  }

  let dentistId = Number(data.dentistId);
  const dentistUser = await User.findByPk(dentistId);
  if (!dentistUser) {
    const staffProfile = await StaffProfile.findByPk(dentistId);
    if (staffProfile) {
      dentistId = staffProfile.userId;
    }
  }

  const teethNumbers = Array.isArray(data.teethNumbers) ? data.teethNumbers : [];
  const totalUnits = data.totalUnits || (teethNumbers.length > 0 ? teethNumbers.length : 1);
  const unitCostPrice = Number(data.unitCostPrice || 0);
  const totalCostPrice = Number(data.totalCostPrice || totalUnits * unitCostPrice);

  const newOrder = await labRepository.createOrder({
    ...data,
    code,
    patientProfileId,
    dentistId,
    teethNumbers,
    totalUnits,
    unitCostPrice,
    totalCostPrice,
    createdBy,
  });

  // Ghi log trạng thái khởi tạo
  await labRepository.createOrderHistory({
    labOrderId: newOrder.id,
    previousStatus: 'new',
    newStatus: newOrder.status || 'draft',
    performedBy: creatorName,
    actionNotes: 'Khởi tạo phiếu đặt hàng Labo',
  });

  return getOrderById(newOrder.id);
};

export const updateOrder = async (id: number, data: any) => {
  const order = await labRepository.findOrderById(id);
  if (!order) {
    throw new AppError(`Không tìm thấy đơn hàng Labo #${id}`, HttpStatus.NOT_FOUND);
  }

  const updatePayload: any = { ...data };

  if (data.patientProfileId) {
    let patientProfileId = Number(data.patientProfileId);
    const profile = await PatientProfile.findByPk(patientProfileId);
    if (!profile) {
      const profileByUserId = await PatientProfile.findOne({ where: { userId: patientProfileId } });
      if (profileByUserId) {
        updatePayload.patientProfileId = profileByUserId.id;
      }
    }
  }

  if (data.dentistId) {
    let dentistId = Number(data.dentistId);
    const dentistUser = await User.findByPk(dentistId);
    if (!dentistUser) {
      const staffProfile = await StaffProfile.findByPk(dentistId);
      if (staffProfile) {
        updatePayload.dentistId = staffProfile.userId;
      }
    }
  }

  if (data.teethNumbers) {
    updatePayload.teethNumbers = Array.isArray(data.teethNumbers) ? data.teethNumbers : [];
    if (!data.totalUnits) {
      updatePayload.totalUnits = updatePayload.teethNumbers.length || 1;
    }
  }

  if (updatePayload.unitCostPrice !== undefined || updatePayload.totalUnits !== undefined) {
    const units = updatePayload.totalUnits || order.totalUnits || 1;
    const unitPrice = updatePayload.unitCostPrice !== undefined ? Number(updatePayload.unitCostPrice) : Number(order.unitCostPrice);
    if (!updatePayload.totalCostPrice) {
      updatePayload.totalCostPrice = units * unitPrice;
    }
  }

  await labRepository.updateOrder(order, updatePayload);
  return getOrderById(id);
};

export const updateOrderStatus = async (
  id: number,
  newStatus: string,
  notes?: string,
  actualDeliveryDate?: string,
  performerName: string = 'Hệ thống'
) => {
  const order = await labRepository.findOrderById(id);
  if (!order) {
    throw new AppError(`Không tìm thấy đơn hàng Labo #${id}`, HttpStatus.NOT_FOUND);
  }

  const previousStatus = order.status;
  const updateData: any = { status: newStatus };

  if (newStatus === 'delivered_to_clinic' && !order.actualDeliveryDate) {
    updateData.actualDeliveryDate = actualDeliveryDate || new Date().toISOString().slice(0, 10);
  }

  if (notes) {
    const timeFormatted = new Date().toLocaleDateString('vi-VN');
    updateData.clinicalNotes = order.clinicalNotes
      ? `${order.clinicalNotes}\n[${timeFormatted}]: ${notes}`
      : `[${timeFormatted}]: ${notes}`;
  }

  await labRepository.updateOrder(order, updateData);

  // Ghi log lịch sử
  await labRepository.createOrderHistory({
    labOrderId: order.id,
    previousStatus,
    newStatus,
    performedBy: performerName,
    actionNotes: notes || `Chuyển trạng thái sang ${newStatus}`,
  });

  return getOrderById(id);
};

export const updateOrderPayment = async (id: number, isPaidToLab: boolean) => {
  const order = await labRepository.findOrderById(id);
  if (!order) {
    throw new AppError(`Không tìm thấy đơn hàng Labo #${id}`, HttpStatus.NOT_FOUND);
  }
  await labRepository.updateOrder(order, { isPaidToLab });
  return getOrderById(id);
};

export const deleteOrder = async (id: number) => {
  const order = await labRepository.findOrderById(id);
  if (!order) {
    throw new AppError(`Không tìm thấy đơn hàng Labo #${id}`, HttpStatus.NOT_FOUND);
  }

  if (order.status !== 'draft' && order.status !== 'cancelled') {
    throw new AppError('Chỉ có thể xóa đơn hàng ở trạng thái Nháp hoặc Đã hủy', HttpStatus.BAD_REQUEST);
  }

  return labRepository.deleteOrder(order);
};

export const getSuppliers = async () => {
  const suppliers = await Supplier.findAll({
    where: { isActive: true },
    order: [['name', 'ASC']],
  });

  // Calculate activeOrdersCount for each supplier
  const formatted = await Promise.all(
    suppliers.map(async (s) => {
      const activeCount = await labRepository.findAllOrders({
        supplierId: s.id,
        limit: 1000,
      });
      const activeOrders = activeCount.orders.filter(
        (o) => o.status !== 'cemented_done' && o.status !== 'cancelled'
      ).length;

      return {
        id: s.id,
        name: s.name,
        code: `LAB-${s.id}`,
        phone: s.phone,
        email: s.email || '',
        address: s.address || '',
        contactPerson: s.contactPerson || '',
        rating: 4.8,
        activeOrdersCount: activeOrders,
      };
    })
  );

  return formatted;
};

export const getWarrantyCards = async (filters: { search?: string; patientProfileId?: number }) => {
  const cards = await labRepository.findAllWarranties(filters);
  return cards.map((c) => formatWarrantyCardResponse(c));
};

export const getWarrantyCardById = async (id: number) => {
  const card = await labRepository.findWarrantyById(id);
  if (!card) {
    throw new AppError(`Không tìm thấy thẻ bảo hành #${id}`, HttpStatus.NOT_FOUND);
  }
  return formatWarrantyCardResponse(card);
};

export const createWarrantyCard = async (data: any) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  const cardCode = `WAR-${dateStr}-${rand}`;

  const newCard = await labRepository.createWarranty({
    ...data,
    cardCode,
  });

  return getWarrantyCardById(newCard.id);
};

export const getReconciliation = async (supplierId: number, month?: string) => {
  const supplier = await Supplier.findByPk(supplierId);
  if (!supplier) {
    throw new AppError(`Không tìm thấy xưởng Labo đối tác #${supplierId}`, HttpStatus.NOT_FOUND);
  }

  const currentMonth = month || new Date().toISOString().slice(0, 7);
  const rawOrders = await labRepository.getReconciliationOrders(supplierId, currentMonth);
  const orders = rawOrders.map((o) => formatLabOrderResponse(o));

  const totalOrders = orders.length;
  const totalUnits = orders.reduce((sum, o) => sum + (o.totalUnits || 1), 0);
  const grossAmount = orders.reduce((sum, o) => sum + (o.totalCostPrice || 0), 0);
  const paidAmount = orders.filter((o) => o.isPaidToLab).reduce((sum, o) => sum + (o.totalCostPrice || 0), 0);
  const warrantyDiscountAmount = 0;
  const netPayableAmount = grossAmount - warrantyDiscountAmount;
  const remainingAmount = netPayableAmount - paidAmount;

  return {
    supplierId: supplier.id,
    supplierName: supplier.name,
    month: currentMonth,
    totalOrders,
    totalUnits,
    grossAmount,
    warrantyDiscountAmount,
    netPayableAmount,
    paidAmount,
    remainingAmount,
    orders,
  };
};
