import User from '../models/userModel.js';
import PatientProfile from '../models/patientProfileModel.js';
import Specialty from '../models/specialtyModel.js';
import { UserRole } from '../constants/enums.js';
import env from '../config/env.js';
import { hashPassword } from './password.js';

export const seedAdmin = async (): Promise<void> => {
  try {
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
    await User.destroy({ where: { email: mockDoctorEmails } });

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
      const existingUser = await User.findOne({ where: { email: acc.email } });
      if (!existingUser) {
        await User.create({
          fullName: acc.fullName,
          email: acc.email,
          password: acc.password,
          phone: acc.phone,
          role: acc.role,
        });
        console.log(`[Seeder] Account ${acc.email} (${acc.role}) created successfully.`);
      } else {
        existingUser.password = acc.password;
        existingUser.role = acc.role;
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
