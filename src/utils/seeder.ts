import User from '../models/userModel.js';
import Role from '../models/roleModel.js';
import PatientProfile from '../models/patientProfileModel.js';
import Specialty from '../models/specialtyModel.js';
import Setting from '../models/settingModel.js';
import Supplier from '../models/supplierModel.js';
import LabOrder from '../models/labOrderModel.js';
import LabOrderHistory from '../models/labOrderHistoryModel.js';
import LabWarrantyCard from '../models/labWarrantyCardModel.js';
import Product from '../models/productModel.js';
import StockBatch from '../models/stockBatchModel.js';
import { UserRole, InventoryCategory, ProductUnit } from '../constants/enums.js';
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

    // Auto-seed Medicines if empty
    await seedMedicines();

    // Auto-seed Dental Supplies / Needles / Gloves / Masks if empty
    await seedInventorySupplies();
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

/**
 * Seed danh mục thuốc nha khoa thường dùng kèm 1 lô tồn kho ban đầu cho mỗi thuốc, để màn
 * "Kê đơn thuốc" có dữ liệu thật để chọn thay vì danh sách rỗng. `activeIngredient` được điền
 * đúng hoạt chất để đối chiếu với khai báo dị ứng trong hồ sơ bệnh nhân (VD: dị ứng Penicillin
 * sẽ cảnh báo với mọi thuốc có gốc Amoxicillin/Augmentin bên dưới).
 */
export const seedMedicines = async (): Promise<void> => {
  try {
    const medicines: {
      name: string;
      unit: ProductUnit;
      sellingPrice: number;
      importPrice: number;
      minStock: number;
      initialQty: number;
      activeIngredient: string;
      pregnancyContraindicated?: boolean;
      description: string;
    }[] = [
      {
        name: 'Amoxicillin 500mg',
        unit: ProductUnit.VIEN,
        sellingPrice: 2500,
        importPrice: 1500,
        minStock: 100,
        initialQty: 800,
        activeIngredient: 'Amoxicillin (nhóm Penicillin)',
        description: 'Kháng sinh phổ rộng, dùng trong nhiễm khuẩn răng miệng, viêm nha chu.',
      },
      {
        name: 'Augmentin 625mg',
        unit: ProductUnit.VIEN,
        sellingPrice: 8500,
        importPrice: 6000,
        minStock: 60,
        initialQty: 400,
        activeIngredient: 'Amoxicillin + Acid Clavulanic (nhóm Penicillin)',
        description: 'Kháng sinh phối hợp, dùng khi nhiễm khuẩn nặng hoặc đã kháng Amoxicillin đơn thuần.',
      },
      {
        name: 'Metronidazol 250mg',
        unit: ProductUnit.VIEN,
        sellingPrice: 1200,
        importPrice: 700,
        minStock: 100,
        initialQty: 600,
        activeIngredient: 'Metronidazol',
        pregnancyContraindicated: true,
        description: 'Kháng sinh diệt vi khuẩn kỵ khí, thường phối hợp điều trị viêm nha chu, áp xe răng.',
      },
      {
        name: 'Clindamycin 300mg',
        unit: ProductUnit.VIEN,
        sellingPrice: 4500,
        importPrice: 3000,
        minStock: 50,
        initialQty: 300,
        activeIngredient: 'Clindamycin',
        description: 'Kháng sinh thay thế cho bệnh nhân dị ứng Penicillin.',
      },
      {
        name: 'Cefuroxim 500mg',
        unit: ProductUnit.VIEN,
        sellingPrice: 5500,
        importPrice: 3800,
        minStock: 50,
        initialQty: 300,
        activeIngredient: 'Cefuroxim (nhóm Cephalosporin)',
        description: 'Kháng sinh Cephalosporin thế hệ 2, dùng cho nhiễm khuẩn răng miệng mức độ vừa.',
      },
      {
        name: 'Erythromycin 500mg',
        unit: ProductUnit.VIEN,
        sellingPrice: 3000,
        importPrice: 2000,
        minStock: 40,
        initialQty: 200,
        activeIngredient: 'Erythromycin (nhóm Macrolid)',
        description: 'Kháng sinh thay thế khi bệnh nhân dị ứng cả Penicillin và Cephalosporin.',
      },
      {
        name: 'Paracetamol 500mg',
        unit: ProductUnit.VIEN,
        sellingPrice: 800,
        importPrice: 400,
        minStock: 150,
        initialQty: 1000,
        activeIngredient: 'Paracetamol',
        description: 'Giảm đau, hạ sốt thông thường sau thủ thuật nha khoa.',
      },
      {
        name: 'Alaxan (Paracetamol + Ibuprofen)',
        unit: ProductUnit.VIEN,
        sellingPrice: 2200,
        importPrice: 1400,
        minStock: 100,
        initialQty: 500,
        activeIngredient: 'Paracetamol + Ibuprofen',
        description: 'Giảm đau kết hợp, dùng sau nhổ răng khôn hoặc tiểu phẫu.',
      },
      {
        name: 'Ibuprofen 400mg',
        unit: ProductUnit.VIEN,
        sellingPrice: 1500,
        importPrice: 900,
        minStock: 100,
        initialQty: 500,
        activeIngredient: 'Ibuprofen',
        pregnancyContraindicated: true,
        description: 'Kháng viêm, giảm đau không steroid (NSAID).',
      },
      {
        name: 'Diclofenac 50mg',
        unit: ProductUnit.VIEN,
        sellingPrice: 1800,
        importPrice: 1100,
        minStock: 60,
        initialQty: 300,
        activeIngredient: 'Diclofenac',
        pregnancyContraindicated: true,
        description: 'Kháng viêm giảm đau NSAID, dùng khi sưng đau nhiều sau thủ thuật.',
      },
      {
        name: 'Alpha Choay 4.2mg',
        unit: ProductUnit.VIEN,
        sellingPrice: 900,
        importPrice: 500,
        minStock: 100,
        initialQty: 600,
        activeIngredient: 'Alphachymotrypsin',
        description: 'Kháng viêm, giảm phù nề sau nhổ răng/tiểu phẫu.',
      },
      {
        name: 'Medrol 16mg',
        unit: ProductUnit.VIEN,
        sellingPrice: 3500,
        importPrice: 2200,
        minStock: 30,
        initialQty: 150,
        activeIngredient: 'Methylprednisolon',
        description: 'Corticoid kháng viêm mạnh, dùng ngắn ngày cho ca sưng nề nhiều (cấy ghép Implant, nhổ răng khôn).',
      },
      {
        name: 'Kháng sinh Doxycyclin 100mg',
        unit: ProductUnit.VIEN,
        sellingPrice: 2000,
        importPrice: 1200,
        minStock: 40,
        initialQty: 200,
        activeIngredient: 'Doxycyclin (nhóm Tetracyclin)',
        pregnancyContraindicated: true,
        description: 'Kháng sinh hỗ trợ điều trị viêm nha chu mạn tính. Chống chỉ định cho trẻ dưới 8 tuổi và phụ nữ mang thai do ảnh hưởng men răng thai nhi.',
      },
      {
        name: 'Chlorhexidine 0.12% (súc miệng)',
        unit: ProductUnit.CHAI,
        sellingPrice: 45000,
        importPrice: 28000,
        minStock: 20,
        initialQty: 80,
        activeIngredient: 'Chlorhexidine Gluconate',
        description: 'Dung dịch súc miệng sát khuẩn, dùng sau tiểu phẫu hoặc điều trị nha chu.',
      },
      {
        name: 'Betadine súc miệng',
        unit: ProductUnit.CHAI,
        sellingPrice: 38000,
        importPrice: 24000,
        minStock: 20,
        initialQty: 80,
        activeIngredient: 'Povidon-Iod',
        description: 'Dung dịch súc miệng sát khuẩn phổ rộng.',
      },
      {
        name: 'Lidocain 2% gel bôi tê',
        unit: ProductUnit.LO,
        sellingPrice: 65000,
        importPrice: 42000,
        minStock: 15,
        initialQty: 50,
        activeIngredient: 'Lidocain',
        description: 'Gel gây tê tại chỗ trước khi tiêm tê hoặc lấy cao răng ở vùng nhạy cảm.',
      },
      {
        name: 'Vitamin 3B (B1-B6-B12)',
        unit: ProductUnit.VIEN,
        sellingPrice: 700,
        importPrice: 350,
        minStock: 100,
        initialQty: 500,
        activeIngredient: 'Thiamin + Pyridoxin + Cyanocobalamin',
        description: 'Bổ sung vitamin nhóm B hỗ trợ phục hồi sau thủ thuật.',
      },
      {
        name: 'Diazepam 5mg',
        unit: ProductUnit.VIEN,
        sellingPrice: 1500,
        importPrice: 900,
        minStock: 20,
        initialQty: 100,
        activeIngredient: 'Diazepam',
        pregnancyContraindicated: true,
        description: 'An thần nhẹ, dùng trước tiểu phẫu cho bệnh nhân lo âu quá mức (cần chỉ định của bác sĩ).',
      },
      {
        name: 'Efferalgan sủi 500mg',
        unit: ProductUnit.VIEN,
        sellingPrice: 1800,
        importPrice: 1100,
        minStock: 60,
        initialQty: 300,
        activeIngredient: 'Paracetamol (dạng sủi)',
        description: 'Giảm đau hạ sốt dạng sủi bọt, hấp thu nhanh hơn viên nén thường.',
      },
      {
        name: 'Lidocain 2% ống tiêm',
        unit: ProductUnit.ONG,
        sellingPrice: 15000,
        importPrice: 9000,
        minStock: 30,
        initialQty: 150,
        activeIngredient: 'Lidocain HCl',
        description: 'Thuốc tê tiêm tại chỗ trước khi nhổ răng, trám răng, lấy tủy.',
      },
      {
        name: 'Articaine 4% + Adrenaline ống tiêm',
        unit: ProductUnit.ONG,
        sellingPrice: 25000,
        importPrice: 16000,
        minStock: 30,
        initialQty: 150,
        activeIngredient: 'Articaine + Adrenaline (Epinephrine)',
        description: 'Thuốc tê nha khoa phổ biến nhất hiện nay, tác dụng nhanh và mạnh hơn Lidocain.',
      },
      {
        name: 'Naproxen 250mg',
        unit: ProductUnit.VIEN,
        sellingPrice: 2000,
        importPrice: 1200,
        minStock: 60,
        initialQty: 300,
        activeIngredient: 'Naproxen',
        pregnancyContraindicated: true,
        description: 'Kháng viêm giảm đau NSAID, tác dụng kéo dài hơn Ibuprofen.',
      },
      {
        name: 'Tranexamic acid 500mg',
        unit: ProductUnit.VIEN,
        sellingPrice: 3000,
        importPrice: 1800,
        minStock: 30,
        initialQty: 150,
        activeIngredient: 'Tranexamic acid',
        description: 'Hỗ trợ cầm máu sau nhổ răng, đặc biệt với bệnh nhân dễ chảy máu kéo dài.',
      },
      {
        name: 'Nystatin 500.000 IU (viên ngậm)',
        unit: ProductUnit.VIEN,
        sellingPrice: 4000,
        importPrice: 2500,
        minStock: 20,
        initialQty: 100,
        activeIngredient: 'Nystatin',
        description: 'Kháng nấm, điều trị nấm miệng (thường gặp sau dùng kháng sinh dài ngày).',
      },
      {
        name: 'Amoxicillin 250mg cốm pha hỗn dịch (trẻ em)',
        unit: ProductUnit.GOI,
        sellingPrice: 3500,
        importPrice: 2200,
        minStock: 30,
        initialQty: 150,
        activeIngredient: 'Amoxicillin (nhóm Penicillin)',
        description: 'Dạng cốm pha hỗn dịch uống cho bệnh nhi chưa uống được viên nén.',
      },
    ];

    const today = new Date();
    let seq = 1;
    let createdCount = 0;

    for (const med of medicines) {
      const code = `MED-${String(seq).padStart(3, '0')}`;
      seq += 1;

      // Idempotent theo từng thuốc (không chặn cả hàm khi đã seed 1 lần trước đó) — lần seed
      // sau chỉ chèn thêm những thuốc mới thêm vào danh sách, không đụng tới thuốc đã có.
      const existing = await Product.findOne({ where: { code } });
      if (existing) continue;

      const product = await Product.create({
        code,
        name: med.name,
        category: InventoryCategory.MEDICINE,
        unit: med.unit,
        minStock: med.minStock,
        sellingPrice: med.sellingPrice,
        description: med.description,
        activeIngredient: med.activeIngredient,
        pregnancyContraindicated: med.pregnancyContraindicated || false,
        isActive: true,
      } as any);

      const expiryDate = new Date(today);
      expiryDate.setMonth(expiryDate.getMonth() + 18);

      await StockBatch.create({
        productId: product.id,
        batchNumber: `LOT-${today.getFullYear()}-${code}`,
        initialQty: med.initialQty,
        currentQty: med.initialQty,
        importPrice: med.importPrice,
        manufacturingDate: today,
        expiryDate,
      } as any);

      createdCount += 1;
    }

    if (createdCount > 0) {
      console.log(`[Seeder] Seeded ${createdCount} new medicine(s) with initial stock batches.`);
    }
  } catch (error: any) {
    console.error('[Seeder] Error seeding medicines:', error.message);
  }
};

/**
 * Seed vật tư tiêu hao cho 4 danh mục còn lại ngoài Thuốc: Vật tư nha khoa, Kim tiêm, Găng
 * tay, Khẩu trang — cùng nguyên tắc idempotent theo từng `code` như `seedMedicines`, để chạy
 * lại seeder nhiều lần (thêm item mới vào mảng) không tạo trùng các item đã có.
 */
export const seedInventorySupplies = async (): Promise<void> => {
  type SupplyItem = {
    name: string;
    unit: ProductUnit;
    sellingPrice: number;
    importPrice: number;
    minStock: number;
    initialQty: number;
    description: string;
  };

  const categories: { category: InventoryCategory; prefix: string; items: SupplyItem[] }[] = [
    {
      category: InventoryCategory.DENTAL_SUPPLY,
      prefix: 'DNS',
      items: [
        {
          name: 'Composite trám răng Filtek Z250',
          unit: ProductUnit.LO,
          sellingPrice: 350000,
          importPrice: 220000,
          minStock: 10,
          initialQty: 40,
          description: 'Vật liệu trám thẩm mỹ ánh trùng hợp, dùng cho trám răng cửa và răng hàm.',
        },
        {
          name: 'Xi măng Glass Ionomer (GIC)',
          unit: ProductUnit.LO,
          sellingPrice: 180000,
          importPrice: 110000,
          minStock: 10,
          initialQty: 30,
          description: 'Vật liệu trám/gắn răng sứ, giải phóng Fluor bảo vệ răng.',
        },
        {
          name: 'Vật liệu trám tạm Cavit',
          unit: ProductUnit.LO,
          sellingPrice: 95000,
          importPrice: 55000,
          minStock: 10,
          initialQty: 30,
          description: 'Trám tạm giữa các buổi điều trị tủy răng.',
        },
        {
          name: 'Bông gòn nha khoa (cotton roll)',
          unit: ProductUnit.GOI,
          sellingPrice: 15000,
          importPrice: 8000,
          minStock: 30,
          initialQty: 150,
          description: 'Cách ly nước bọt khi trám răng, lấy dấu.',
        },
        {
          name: 'Gạc y tế vô trùng',
          unit: ProductUnit.GOI,
          sellingPrice: 12000,
          importPrice: 6500,
          minStock: 30,
          initialQty: 150,
          description: 'Cầm máu và vệ sinh vết thương sau tiểu phẫu.',
        },
        {
          name: 'Chỉ khâu phẫu thuật (silk suture)',
          unit: ProductUnit.HOP,
          sellingPrice: 220000,
          importPrice: 140000,
          minStock: 5,
          initialQty: 20,
          description: 'Khâu đóng vết thương sau nhổ răng khôn, cấy ghép Implant.',
        },
        {
          name: 'Chỉ co nướu (retraction cord)',
          unit: ProductUnit.CUON,
          sellingPrice: 85000,
          importPrice: 50000,
          minStock: 10,
          initialQty: 30,
          description: 'Đẩy nướu lộ cùi răng khi lấy dấu làm răng sứ.',
        },
        {
          name: 'Vật liệu lấy dấu Alginate',
          unit: ProductUnit.HOP,
          sellingPrice: 150000,
          importPrice: 95000,
          minStock: 5,
          initialQty: 20,
          description: 'Lấy dấu hàm răng để chế tác mẫu thạch cao/phục hình.',
        },
        {
          name: 'Mũi khoan nha khoa (dental bur)',
          unit: ProductUnit.HOP,
          sellingPrice: 280000,
          importPrice: 180000,
          minStock: 5,
          initialQty: 25,
          description: 'Bộ mũi khoan kim cương/carbide dùng mài răng, sửa soạn cùi.',
        },
        {
          name: 'Đầu trâm nội nha (endo file)',
          unit: ProductUnit.HOP,
          sellingPrice: 320000,
          importPrice: 210000,
          minStock: 5,
          initialQty: 15,
          description: 'Dụng cụ tạo hình và làm sạch ống tủy khi điều trị nội nha.',
        },
        {
          name: 'Yếm giấy trải ghế nha khoa (bib)',
          unit: ProductUnit.GOI,
          sellingPrice: 45000,
          importPrice: 28000,
          minStock: 15,
          initialQty: 60,
          description: 'Yếm giấy chống thấm dùng 1 lần cho bệnh nhân.',
        },
        {
          name: 'Chỉ nha khoa (dental floss)',
          unit: ProductUnit.HOP,
          sellingPrice: 25000,
          importPrice: 14000,
          minStock: 20,
          initialQty: 80,
          description: 'Phát cho bệnh nhân sau khi vệ sinh/lấy cao răng để hướng dẫn chăm sóc tại nhà.',
        },
      ],
    },
    {
      category: InventoryCategory.NEEDLE,
      prefix: 'NDL',
      items: [
        {
          name: 'Kim tiêm nha khoa ngắn 27G',
          unit: ProductUnit.HOP,
          sellingPrice: 120000,
          importPrice: 75000,
          minStock: 10,
          initialQty: 40,
          description: 'Kim gây tê tại chỗ cho các thủ thuật đơn giản (trám, lấy cao răng).',
        },
        {
          name: 'Kim tiêm nha khoa dài 25G',
          unit: ProductUnit.HOP,
          sellingPrice: 135000,
          importPrice: 85000,
          minStock: 10,
          initialQty: 40,
          description: 'Kim gây tê vùng, dùng cho nhổ răng hàm và tiểu phẫu.',
        },
        {
          name: 'Kim tiêm 3ml dùng 1 lần',
          unit: ProductUnit.HOP,
          sellingPrice: 55000,
          importPrice: 32000,
          minStock: 15,
          initialQty: 60,
          description: 'Kim tiêm thông thường dùng pha/tiêm thuốc hỗ trợ.',
        },
        {
          name: 'Ống tiêm nha khoa (carpule syringe)',
          unit: ProductUnit.CAI,
          sellingPrice: 450000,
          importPrice: 300000,
          minStock: 3,
          initialQty: 10,
          description: 'Ống bơm tiêm chuyên dụng dùng với ống thuốc tê carpule (Lidocain, Articaine).',
        },
      ],
    },
    {
      category: InventoryCategory.GLOVE,
      prefix: 'GLV',
      items: [
        {
          name: 'Găng tay Latex y tế size S',
          unit: ProductUnit.HOP,
          sellingPrice: 95000,
          importPrice: 60000,
          minStock: 20,
          initialQty: 80,
          description: 'Hộp 100 chiếc, dùng 1 lần, cho nhân viên tay nhỏ.',
        },
        {
          name: 'Găng tay Latex y tế size M',
          unit: ProductUnit.HOP,
          sellingPrice: 95000,
          importPrice: 60000,
          minStock: 30,
          initialQty: 120,
          description: 'Hộp 100 chiếc, dùng 1 lần, kích cỡ phổ biến nhất.',
        },
        {
          name: 'Găng tay Latex y tế size L',
          unit: ProductUnit.HOP,
          sellingPrice: 95000,
          importPrice: 60000,
          minStock: 20,
          initialQty: 80,
          description: 'Hộp 100 chiếc, dùng 1 lần, cho nhân viên tay lớn.',
        },
        {
          name: 'Găng tay Nitrile không bột',
          unit: ProductUnit.HOP,
          sellingPrice: 130000,
          importPrice: 85000,
          minStock: 15,
          initialQty: 50,
          description: 'Thay thế cho nhân viên/bệnh nhân dị ứng Latex.',
        },
      ],
    },
    {
      category: InventoryCategory.MASK,
      prefix: 'MSK',
      items: [
        {
          name: 'Khẩu trang y tế 3 lớp',
          unit: ProductUnit.HOP,
          sellingPrice: 45000,
          importPrice: 25000,
          minStock: 30,
          initialQty: 150,
          description: 'Hộp 50 chiếc, dùng hàng ngày cho toàn bộ nhân viên phòng khám.',
        },
        {
          name: 'Khẩu trang N95',
          unit: ProductUnit.HOP,
          sellingPrice: 180000,
          importPrice: 120000,
          minStock: 10,
          initialQty: 40,
          description: 'Khẩu trang lọc bụi mịn cao cấp, dùng khi khoan mài/thủ thuật phát sinh nhiều khí dung.',
        },
        {
          name: 'Mặt nạ chống giọt bắn (face shield)',
          unit: ProductUnit.CAI,
          sellingPrice: 35000,
          importPrice: 20000,
          minStock: 15,
          initialQty: 50,
          description: 'Bảo hộ mắt và mặt cho bác sĩ khi thực hiện thủ thuật phát sinh khí dung.',
        },
      ],
    },
  ];

  const today = new Date();
  let totalCreated = 0;

  for (const { category, prefix, items } of categories) {
    try {
      let seq = 1;
      for (const item of items) {
        const code = `${prefix}-${String(seq).padStart(3, '0')}`;
        seq += 1;

        const existing = await Product.findOne({ where: { code } });
        if (existing) continue;

        const product = await Product.create({
          code,
          name: item.name,
          category,
          unit: item.unit,
          minStock: item.minStock,
          sellingPrice: item.sellingPrice,
          description: item.description,
          isActive: true,
        } as any);

        const expiryDate = new Date(today);
        expiryDate.setMonth(expiryDate.getMonth() + 24);

        await StockBatch.create({
          productId: product.id,
          batchNumber: `LOT-${today.getFullYear()}-${code}`,
          initialQty: item.initialQty,
          currentQty: item.initialQty,
          importPrice: item.importPrice,
          manufacturingDate: today,
          expiryDate,
        } as any);

        totalCreated += 1;
      }
    } catch (error: any) {
      console.error(`[Seeder] Error seeding category '${category}':`, error.message);
    }
  }

  if (totalCreated > 0) {
    console.log(`[Seeder] Seeded ${totalCreated} new supply item(s) (dental supply/needle/glove/mask) with stock batches.`);
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


