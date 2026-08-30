import User from '../models/userModel.js';
import Role from '../models/roleModel.js';
import PatientProfile from '../models/patientProfileModel.js';
import Specialty from '../models/specialtyModel.js';
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
  } catch (error: any) {
    console.error('[Seeder] Error seeding accounts:', error.message);
  }
};
