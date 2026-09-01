import User from '../models/userModel.js';
import Role from '../models/roleModel.js';
import PatientProfile from '../models/patientProfileModel.js';
import Specialty from '../models/specialtyModel.js';
import Setting from '../models/settingModel.js';
import Supplier from '../models/supplierModel.js';
import LabOrder from '../models/labOrderModel.js';
import LabOrderHistory from '../models/labOrderHistoryModel.js';
import LabWarrantyCard from '../models/labWarrantyCardModel.js';
import { UserRole } from '../constants/enums.js';
import env from '../config/env.js';
import { hashPassword } from './password.js';

export const ALL_SYSTEM_PERMISSIONS = [
  'patients.view', 'patients.create', 'patients.edit', 'patients.medical_history', 'patients.delete',
  'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.assign_doctor', 'appointments.cancel',
  'prescriptions.view', 'prescriptions.create', 'prescriptions.edit', 'prescriptions.print', 'prescriptions.templates',
  'services.view', 'services.create', 'services.edit', 'services.categories', 'services.delete',
  'inventory.view', 'inventory.import', 'inventory.adjust', 'inventory.suppliers', 'inventory.transactions',
  'staff.view', 'staff.create', 'staff.edit', 'staff.specialties', 'staff.roles', 'staff.delete',
  'invoices.view', 'invoices.create', 'invoices.payment', 'invoices.discount', 'invoices.cancel',
  'labo.view', 'labo.create', 'labo.edit', 'labo.warranty', 'labo.reconciliation',
  'settings.clinic_info', 'settings.audit_log', 'settings.backup',
];

export const seedRoles = async (): Promise<void> => {
  const initialRoles = [
    {
      name: 'Quản trị viên',
      code: 'admin',
      color: 'volcano',
      description: 'Toàn quyền truy cập, cấu hình và quản trị mọi phân hệ trên hệ thống phòng khám.',
      isSystem: true,
      permissions: [...ALL_SYSTEM_PERMISSIONS],
    },
    {
      name: 'Bác sĩ nha khoa',
      code: 'dentist',
      color: 'blue',
      description: 'Chẩn đoán điều trị, xem hồ sơ bệnh án, kê đơn thuốc và quản lý lịch hẹn khám.',
      isSystem: true,
      permissions: [
        'patients.view',
        'patients.create',
        'patients.edit',
        'patients.medical_history',
        'appointments.view',
        'appointments.edit',
        'appointments.assign_doctor',
        'prescriptions.view',
        'prescriptions.create',
        'prescriptions.edit',
        'prescriptions.print',
        'prescriptions.templates',
        'services.view',
        'inventory.view',
        'staff.view',
        'invoices.view',
      ],
    },
    {
      name: 'Lễ tân & Tiếp đón',
      code: 'staff',
      color: 'cyan',
      description: 'Tiếp đón bệnh nhân, đặt và đổi lịch hẹn, tạo hồ sơ bệnh nhân và thu tiền ban đầu.',
      isSystem: true,
      permissions: [
        'patients.view',
        'patients.create',
        'patients.edit',
        'appointments.view',
        'appointments.create',
        'appointments.edit',
        'appointments.cancel',
        'appointments.assign_doctor',
        'services.view',
        'staff.view',
        'invoices.view',
        'invoices.create',
        'invoices.payment',
      ],
    },
    {
      name: 'Thủ kho & Dược sĩ',
      code: 'inventory',
      color: 'emerald',
      description: 'Quản lý kho thuốc, vật tư y tế, thực hiện nhập kho, điều chỉnh và quản lý nhà cung cấp.',
      isSystem: false,
      permissions: [
        'inventory.view',
        'inventory.import',
        'inventory.adjust',
        'inventory.suppliers',
        'inventory.transactions',
        'prescriptions.view',
        'prescriptions.print',
      ],
    },
    {
      name: 'Kế toán & Thu ngân',
      code: 'cashier',
      color: 'purple',
      description: 'Quản lý lập hóa đơn, xác nhận thanh toán, áp dụng chiết khấu/voucher và báo cáo tài chính.',
      isSystem: false,
      permissions: [
        'invoices.view',
        'invoices.create',
        'invoices.payment',
        'invoices.discount',
        'invoices.cancel',
        'services.view',
        'patients.view',
      ],
    },
    {
      name: 'Trợ thủ nha khoa',
      code: 'assistant',
      color: 'amber',
      description: 'Hỗ trợ bác sĩ trong ca điều trị, chuẩn bị vật tư ghế nha và tra cứu tiền sử bệnh nhân.',
      isSystem: false,
      permissions: [
        'patients.view',
        'patients.medical_history',
        'appointments.view',
        'services.view',
        'inventory.view',
      ],
    },
  ];

  for (const r of initialRoles) {
    const existing = await Role.findOne({ where: { code: r.code } });
    if (!existing) {
      await Role.create(r);
      console.log(`[Seeder] Role '${r.name}' (${r.code}) created successfully.`);
    }
  }
};

export const seedAdmin = async (): Promise<void> => {
  try {
    // 1. Seed Roles trước
    await seedRoles();

    const roleMap = new Map<string, number>();
    const allRoles = await Role.findAll();
    for (const r of allRoles) {
      roleMap.set(r.code, r.id);
    }

    const defaultPassword = '';
    const defaultHashedPassword = await hashPassword(defaultPassword);
    const adminHashedPassword = await hashPassword(env.ADMIN_PASSWORD || 'Admin@123456');

    // Dọn dẹp các tài khoản bác sĩ mock đã seed trước đây nếu có
    const mockDoctorEmails = [
      'bacsi1@dental.com',
      'bacsi2@dental.com',
      'bacsi3@dental.com',
      'bacsi4@dental.com',
    ];
    try {
      await User.destroy({ where: { email: mockDoctorEmails } });
    } catch (_) {}

    const accounts = [
      // ── Lễ tân 1, 2, 3, 4 ──
      {
        fullName: 'Lễ tân Nguyễn Thu Hà',
        email: 'letan1@dental.com',
        phone: '0901000001',
        role: UserRole.STAFF,
        password: defaultHashedPassword,
      },
      {
        fullName: 'Lễ tân Trần Thanh Hương',
        email: 'letan2@dental.com',
        phone: '0901000002',
        role: UserRole.STAFF,
        password: defaultHashedPassword,
      },
      {
        fullName: 'Lễ tân Phạm Mỹ Duyên',
        email: 'letan3@dental.com',
        phone: '0901000003',
        role: UserRole.STAFF,
        password: defaultHashedPassword,
      },
      {
        fullName: 'Lễ tân Đỗ Hoàng Ngân',
        email: 'letan4@dental.com',
        phone: '0901000004',
        role: UserRole.STAFF,
        password: defaultHashedPassword,
      },

      // ── Admin ──
      {
        fullName: 'System Admin',
        email: env.ADMIN_EMAIL || 'admin@dentalclinic.com',
        phone: '0123456789',
        role: UserRole.ADMIN,
        password: adminHashedPassword,
      },
    ];

    for (const acc of accounts) {
      const assignedRoleId = roleMap.get(acc.role) || null;
      const existingUser = await User.findOne({ where: { email: acc.email } });
      if (!existingUser) {
        await User.create({
          fullName: acc.fullName,
          email: acc.email,
          password: acc.password,
          phone: acc.phone,
          role: acc.role,
          roleId: assignedRoleId,
        });
        console.log(`[Seeder] Account ${acc.email} (${acc.role}) created successfully.`);
      } else {
        existingUser.password = acc.password;
        existingUser.role = acc.role;
        existingUser.roleId = assignedRoleId;
        existingUser.fullName = acc.fullName;
        await existingUser.save();
        console.log(`[Seeder] Account ${acc.email} updated.`);
      }
    }

    // Auto-create PatientProfile for any Patient users in DB missing a profile
    const patientUsers = await User.findAll({ where: { role: UserRole.PATIENT } });
    for (const p of patientUsers) {
      const profileExists = await PatientProfile.findOne({ where: { userId: p.id } });
      if (!profileExists) {
        await PatientProfile.create({
          userId: p.id,
          medicalHistory: null,
          notes: null,
        } as any);
        console.log(`[Seeder] Created missing PatientProfile for User #${p.id} (${p.fullName})`);
      }
    }

    // Auto-seed Specialties if empty
    const specialtyCount = await Specialty.count();
    if (specialtyCount === 0) {
      const defaultSpecialties = [
        { name: 'Cấy ghép Implant', slug: 'cay-ghep-implant' },
        { name: 'Niềng răng & Chỉnh nha', slug: 'nieng-rang-chinh-nha' },
        { name: 'Răng sứ & Thẩm mỹ', slug: 'rang-su-tham-my' },
        { name: 'Phẫu thuật & Nhổ răng khôn', slug: 'phau-thuat-nho-rang-khon' },
        { name: 'Nha khoa Tổng quát', slug: 'nha-khoa-tong-quat' },
        { name: 'Nha khoa Trẻ em', slug: 'nha-khoa-tre-em' },
        { name: 'Điều trị tủy & Nội nha', slug: 'dieu-tri-tuy-noi-nha' },
      ];
      await Specialty.bulkCreate(defaultSpecialties);
      console.log('[Seeder] Default specialties seeded successfully.');
    }

    // Auto-seed Default Settings if empty
    await seedSettings();

    // Auto-seed Labo Data if empty
    await seedLaboData();
  } catch (error: any) {
    console.error('[Seeder] Error seeding accounts:', error.message);
  }
};

export const seedSettings = async (): Promise<void> => {
  try {
    const defaultSettings = [
      {
        key: 'clinic',
        description: 'Thông tin phòng khám, thương hiệu & thời gian vận hành',
        value: {
          name: 'Nha Khoa Quốc Tế Smilevia',
          slogan: 'Nụ cười rạng rỡ - Tự tin tỏa sáng',
          taxCode: '0316888999',
          phone: '1900 6868 - 028 7302 6868',
          email: 'contact@smilevia.vn',
          website: 'https://smilevia.vn',
          address: '128 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP. Hồ Chí Minh',
          branch2: '45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
          openTime: '08:00',
          closeTime: '20:00',
          breakStart: '12:00',
          breakEnd: '13:30',
          autoConfirm: true,
          allowOnlineBooking: true,
        },
      },
      {
        key: 'payment',
        description: 'Cấu hình cổng thanh toán VietQR & phương thức thanh toán quầy',
        value: {
          bankCode: 'VCB',
          accountNo: '1028889999',
          accountName: 'NHA KHOA QUOC TE SMILEVIA',
          qrSyntax: 'SMILEVIA {INVOICE_CODE}',
          enableVietQR: true,
          enableMomo: true,
          enablePos: true,
        },
      },
      {
        key: 'print',
        description: 'Cấu hình mẫu in hóa đơn & phiếu thu khám chữa bệnh',
        value: {
          paperSize: 'k80',
          receiptTitle: 'PHIẾU THU TIỀN NHA KHOA',
          footerNotes: 'Cảm ơn Quý khách đã tin tưởng và sử dụng dịch vụ tại Smilevia!\nQuý khách vui lòng giữ hóa đơn để tái khám và đối soát bảo hành.',
          showToothNumber: true,
          showDoctorSign: true,
          autoPrintAfterPayment: false,
        },
      },
    ];

    for (const item of defaultSettings) {
      const existing = await Setting.findByPk(item.key);
      if (!existing) {
        await Setting.create({
          key: item.key,
          value: item.value,
          description: item.description,
        });
        console.log(`[Seeder] Default setting '${item.key}' seeded successfully.`);
      }
    }
  } catch (error: any) {
    console.error('[Seeder] Error seeding settings:', error.message);
  }
};

export const seedLaboData = async (): Promise<void> => {
  try {
    // 1. Seed Lab Suppliers if missing
    const labSuppliers = [
      {
        name: 'Xưởng Labo Nha Khoa Quốc Tế DentArt',
        phone: '0908 123 456',
        email: 'contact@dentartlab.vn',
        address: '124 Nguyễn Đình Chiểu, P. Đa Kao, Quận 1, TP.HCM',
        contactPerson: 'KTV Trưởng Trần Quang Vinh',
        isActive: true,
      },
      {
        name: 'Trung Tâm Phục Hình Kỹ Thuật Số Cercon Lab',
        phone: '0912 345 678',
        email: 'order@cerconlab.com.vn',
        address: '45 Lê Văn Sỹ, P.13, Quận 3, TP.HCM',
        contactPerson: 'KTV Hoàng Minh Tuấn',
        isActive: true,
      },
      {
        name: 'Labo Phục Hình Implant & Hàm Khung Việt Đức',
        phone: '0988 765 432',
        email: 'support@vietduclab.com',
        address: '88 Giải Phóng, Đống Đa, Hà Nội',
        contactPerson: 'KTV Lê Văn Hùng',
        isActive: true,
      },
    ];

    const supplierMap = new Map<string, number>();
    for (const sup of labSuppliers) {
      let existing = await Supplier.findOne({ where: { name: sup.name } });
      if (!existing) {
        existing = await Supplier.create(sup);
        console.log(`[Seeder] Lab Supplier '${sup.name}' created.`);
      }
      supplierMap.set(sup.name, existing.id);
    }

    // 2. Check if Lab Orders exist
    const orderCount = await LabOrder.count();
    if (orderCount === 0) {
      const patientProfile = await PatientProfile.findOne();
      const dentist = await User.findOne({ where: { role: UserRole.DENTIST } }) || await User.findOne({ where: { role: UserRole.ADMIN } });
      const sup1Id = supplierMap.get('Xưởng Labo Nha Khoa Quốc Tế DentArt') || 1;
      const sup2Id = supplierMap.get('Trung Tâm Phục Hình Kỹ Thuật Số Cercon Lab') || 2;
      const sup3Id = supplierMap.get('Labo Phục Hình Implant & Hàm Khung Việt Đức') || 3;

      if (patientProfile && dentist) {
        const order1 = await LabOrder.create({
          code: 'LAB-20260719-001',
          patientProfileId: patientProfile.id,
          dentistId: dentist.id,
          supplierId: sup1Id,
          restorationCategory: 'veneer_inlay',
          restorationTypeName: 'Mặt dán sứ Veneer Emax Press',
          materialName: 'Emax Press Multi',
          teethNumbers: [11, 12, 21, 22],
          totalUnits: 4,
          shadeSystem: 'bleach',
          shadeMain: 'BL2',
          shadeCervical: 'BL3',
          shadeBody: 'BL2',
          shadeIncisal: 'Trong mờ men răng tự nhiên',
          translucencyLevel: 'high',
          characterizationNotes: 'Làm rìa cắn hơi bo tròn nữ tính, vân men nhẹ tự nhiên, không làm quá phẳng.',
          marginDesign: 'shoulder',
          occlusionType: 'normal',
          proximalContact: 'point_normal',
          sentDate: '2026-07-15',
          deliveryDueDate: '2026-07-20',
          actualDeliveryDate: '2026-07-19',
          patientAppointmentDate: '2026-07-21 09:00',
          status: 'delivered_to_clinic',
          unitCostPrice: 1200000,
          totalCostPrice: 4800000,
          isPaidToLab: false,
          clinicalNotes: 'Khách yêu cầu nụ cười sáng nhưng tự nhiên khi quay phim.',
        });

        await LabOrderHistory.create({
          labOrderId: order1.id,
          previousStatus: 'draft',
          newStatus: 'delivered_to_clinic',
          performedBy: 'Hệ thống',
          actionNotes: 'Đã giao về phòng khám sẵn sàng lắp',
        });

        const order2 = await LabOrder.create({
          code: 'LAB-20260718-002',
          patientProfileId: patientProfile.id,
          dentistId: dentist.id,
          supplierId: sup2Id,
          restorationCategory: 'fixed_crown_bridge',
          restorationTypeName: 'Cầu răng sứ toàn phần Zirconia',
          materialName: 'Cercon HT Zirconia',
          teethNumbers: [45, 46, 47],
          totalUnits: 3,
          shadeSystem: 'vita_classical',
          shadeMain: 'A3',
          shadeCervical: 'A3.5',
          shadeBody: 'A3',
          shadeIncisal: 'A2',
          translucencyLevel: 'medium',
          characterizationNotes: 'Mặt nhai rãnh hố hơi nhuộm màu nhẹ cho giống răng đối diện.',
          marginDesign: 'chamfer',
          occlusionType: 'relieved_light',
          proximalContact: 'broad_flat',
          ponticDesign: 'modified_ridge_lap',
          sentDate: '2026-07-16',
          deliveryDueDate: '2026-07-20',
          patientAppointmentDate: '2026-07-20 15:30',
          status: 'in_fabrication',
          unitCostPrice: 900000,
          totalCostPrice: 2700000,
          isPaidToLab: false,
          clinicalNotes: 'Nhịp R46 nướu đã lành thương 2 tháng, mài bờ vai xuôi nhẹ.',
        });

        await LabOrderHistory.create({
          labOrderId: order2.id,
          previousStatus: 'draft',
          newStatus: 'in_fabrication',
          performedBy: 'Hệ thống',
          actionNotes: 'Xưởng đang đúc sườn và nung sứ',
        });

        const order3 = await LabOrder.create({
          code: 'LAB-20260714-003',
          patientProfileId: patientProfile.id,
          dentistId: dentist.id,
          supplierId: sup3Id,
          restorationCategory: 'implant_prosthetics',
          restorationTypeName: 'Mão sứ bắt vít trên Implant',
          materialName: 'Custom Abutment + Mão Lava Plus',
          teethNumbers: [36],
          totalUnits: 1,
          shadeSystem: 'vita_3d_master',
          shadeMain: '3M2',
          translucencyLevel: 'medium',
          marginDesign: 'chamfer',
          occlusionType: 'normal',
          proximalContact: 'point_normal',
          sentDate: '2026-07-12',
          deliveryDueDate: '2026-07-17',
          actualDeliveryDate: '2026-07-17',
          patientAppointmentDate: '2026-07-18 10:00',
          status: 'cemented_done',
          unitCostPrice: 2500000,
          totalCostPrice: 2500000,
          isPaidToLab: true,
          dentistRating: 5,
          dentistFeedback: 'Khít sát hoàn hảo, khớp cắn không cần mài chỉnh gì thêm.',
        });

        await LabWarrantyCard.create({
          cardCode: 'WAR-20260714-36',
          labOrderId: order3.id,
          patientProfileId: patientProfile.id,
          teethList: 'R36',
          prostheticName: 'Mão sứ bắt vít trên Implant (Lava Plus 3M)',
          materialBrand: '3M ESPE (USA)',
          warrantyYears: 15,
          startDate: '2026-07-18',
          endDate: '2041-07-18',
          warrantyStatus: 'active',
          termsAndConditions: 'Bảo hành nứt, vỡ, mẻ sứ hoặc lỏng vít Abutment trong điều kiện ăn nhai bình thường. Tái khám định kỳ 6 tháng/lần.',
        });

        console.log('[Seeder] Default Lab orders & warranties seeded successfully.');
      }
    }
  } catch (error: any) {
    console.error('[Seeder] Error seeding labo data:', error.message);
  }
};


