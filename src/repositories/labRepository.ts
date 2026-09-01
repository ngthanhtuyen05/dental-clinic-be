import { Op } from 'sequelize';
import {
  LabOrder,
  LabOrderHistory,
  LabWarrantyCard,
  PatientProfile,
  User,
  Supplier,
  TreatmentHistory,
} from '../models/index.js';
import type { LabOrderModel } from '../models/labOrderModel.js';
import type { LabWarrantyCardModel } from '../models/labWarrantyCardModel.js';
import type { LabOrderHistoryModel } from '../models/labOrderHistoryModel.js';

export interface LabOrderFilterOptions {
  search?: string;
  status?: string;
  category?: string;
  supplierId?: number;
  dentistId?: number;
  patientProfileId?: number;
  urgentOnly?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class LabRepository {
  // ── 1. ĐƠN HÀNG LABO ──
  async findAllOrders(filters: LabOrderFilterOptions = {}) {
    const {
      search,
      status,
      category,
      supplierId,
      dentistId,
      patientProfileId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (category && category !== 'all') {
      where.restorationCategory = category;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (dentistId) {
      where.dentistId = dentistId;
    }

    if (patientProfileId) {
      where.patientProfileId = patientProfileId;
    }

    if (startDate && endDate) {
      where.sentDate = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.sentDate = { [Op.gte]: startDate };
    } else if (endDate) {
      where.sentDate = { [Op.lte]: endDate };
    }

    if (search?.trim()) {
      const q = search.trim();
      where[Op.or] = [
        { code: { [Op.like]: `%${q}%` } },
        { materialName: { [Op.like]: `%${q}%` } },
        { restorationTypeName: { [Op.like]: `%${q}%` } },
        { '$patientProfile.user.fullName$': { [Op.like]: `%${q}%` } },
        { '$patientProfile.user.phone$': { [Op.like]: `%${q}%` } },
        { '$supplier.name$': { [Op.like]: `%${q}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { rows, count } = await LabOrder.findAndCountAll({
      where,
      include: [
        {
          model: PatientProfile,
          as: 'patientProfile',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'phone', 'email'],
            },
          ],
        },
        {
          model: User,
          as: 'dentist',
          attributes: ['id', 'fullName', 'phone', 'email'],
        },
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'phone', 'email', 'address', 'contactPerson'],
        },
        {
          model: LabWarrantyCard,
          as: 'warrantyCard',
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
      distinct: true,
    });

    return {
      orders: rows,
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / Number(limit)),
    };
  }

  async findOrderById(id: number): Promise<LabOrderModel | null> {
    return LabOrder.findByPk(id, {
      include: [
        {
          model: PatientProfile,
          as: 'patientProfile',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'phone', 'email'],
            },
          ],
        },
        {
          model: User,
          as: 'dentist',
          attributes: ['id', 'fullName', 'phone', 'email'],
        },
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'phone', 'email', 'address', 'contactPerson'],
        },
        {
          model: LabOrderHistory,
          as: 'statusHistories',
          order: [['createdAt', 'ASC']],
        },
        {
          model: LabWarrantyCard,
          as: 'warrantyCard',
        },
      ],
    });
  }

  async findOrderByCode(code: string): Promise<LabOrderModel | null> {
    return LabOrder.findOne({ where: { code } });
  }

  async createOrder(data: any): Promise<LabOrderModel> {
    return LabOrder.create(data);
  }

  async updateOrder(order: LabOrderModel, data: any): Promise<LabOrderModel> {
    return order.update(data);
  }

  async deleteOrder(order: LabOrderModel): Promise<boolean> {
    await order.destroy();
    return true;
  }

  async getOrderStats(): Promise<{ [key: string]: number }> {
    const orders = await LabOrder.findAll({
      attributes: ['status'],
    });

    const stats: { [key: string]: number } = {
      all: orders.length,
      draft: 0,
      sent_to_lab: 0,
      lab_received: 0,
      in_fabrication: 0,
      framework_try_in: 0,
      delivered_to_clinic: 0,
      clinical_try_in: 0,
      adjustment_needed: 0,
      remake_needed: 0,
      cemented_done: 0,
      cancelled: 0,
    };

    for (const o of orders) {
      if (stats[o.status] !== undefined) {
        stats[o.status]++;
      }
    }

    return stats;
  }

  // ── 2. LỊCH SỬ TRẠNG THÁI ──
  async createOrderHistory(data: {
    labOrderId: number;
    previousStatus: string;
    newStatus: string;
    performedBy: string;
    actionNotes?: string | null;
  }): Promise<LabOrderHistoryModel> {
    return LabOrderHistory.create(data);
  }

  // ── 3. THẺ BẢO HÀNH ──
  async findAllWarranties(filters: { search?: string; patientProfileId?: number } = {}) {
    const where: any = {};
    if (filters.patientProfileId) {
      where.patientProfileId = filters.patientProfileId;
    }

    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where[Op.or] = [
        { cardCode: { [Op.like]: `%${q}%` } },
        { prostheticName: { [Op.like]: `%${q}%` } },
        { materialBrand: { [Op.like]: `%${q}%` } },
        { teethList: { [Op.like]: `%${q}%` } },
        { '$patientProfile.user.fullName$': { [Op.like]: `%${q}%` } },
        { '$patientProfile.user.phone$': { [Op.like]: `%${q}%` } },
      ];
    }

    return LabWarrantyCard.findAll({
      where,
      include: [
        {
          model: PatientProfile,
          as: 'patientProfile',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'phone', 'email'],
            },
          ],
        },
        {
          model: LabOrder,
          as: 'labOrder',
          include: [
            {
              model: User,
              as: 'dentist',
              attributes: ['id', 'fullName'],
            },
            {
              model: Supplier,
              as: 'supplier',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async findWarrantyById(id: number): Promise<LabWarrantyCardModel | null> {
    return LabWarrantyCard.findByPk(id, {
      include: [
        {
          model: PatientProfile,
          as: 'patientProfile',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'phone', 'email'],
            },
          ],
        },
        {
          model: LabOrder,
          as: 'labOrder',
          include: [
            {
              model: User,
              as: 'dentist',
              attributes: ['id', 'fullName'],
            },
            {
              model: Supplier,
              as: 'supplier',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
    });
  }

  async createWarranty(data: any): Promise<LabWarrantyCardModel> {
    return LabWarrantyCard.create(data);
  }

  // ── 4. ĐỐI SOÁT CÔNG NỢ ──
  async getReconciliationOrders(supplierId: number, month?: string) {
    const where: any = {
      supplierId,
    };

    if (month) {
      // month format: YYYY-MM
      const startDate = `${month}-01`;
      const nextMonthDate = new Date(startDate);
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
      const endDate = nextMonthDate.toISOString().slice(0, 10);

      where.sentDate = { [Op.gte]: startDate, [Op.lt]: endDate };
    }

    return LabOrder.findAll({
      where,
      include: [
        {
          model: PatientProfile,
          as: 'patientProfile',
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
      ],
      order: [['sentDate', 'DESC']],
    });
  }
}

export const labRepository = new LabRepository();
