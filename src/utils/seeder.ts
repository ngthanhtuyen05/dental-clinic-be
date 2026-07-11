import bcrypt from 'bcrypt';
import User from '../models/userModel.js';
import { UserRole } from '../constants/enums.js';

export const seedAdmin = async (): Promise<void> => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@dentalclinic.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

    // Check if an admin already exists in the system
    const adminExists = await User.findOne({
      where: {
        role: UserRole.ADMIN,
      },
    });

    if (!adminExists) {
      // Check if email is already taken by another user role
      const emailExists = await User.findOne({
        where: {
          email: adminEmail,
        },
      });

      if (emailExists) {
        console.log(`[Seeder] Email ${adminEmail} is already taken by another user. Admin seeding skipped.`);
        return;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      // Create the default admin account
      await User.create({
        fullName: 'System Admin',
        email: adminEmail,
        password: hashedPassword,
        phone: '0123456789',
        role: UserRole.ADMIN,
      });

      console.log('[Seeder] Default admin account successfully seeded!');
      console.log(`- Email: ${adminEmail}`);
      console.log(`- Password: ${adminPassword}`);
    } else {
      console.log('[Seeder] Admin account already exists. Seeding skipped.');
    }
  } catch (error: any) {
    console.error('[Seeder] Error seeding admin account:', error.message);
  }
};
