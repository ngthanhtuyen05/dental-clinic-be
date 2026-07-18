import bcrypt from 'bcrypt';
import User from '../models/userModel.js';
import { UserRole } from '../constants/enums.js';
import env from '../config/env.js';
import Messages from '../constants/messages.js';

export const seedAdmin = async (): Promise<void> => {
  try {
    const adminEmail = env.ADMIN_EMAIL;
    const adminPassword = env.ADMIN_PASSWORD;

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
        console.log(`[Seeder] ${Messages.SEEDER.EMAIL_TAKEN(adminEmail)}`);
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

      console.log(`[Seeder] ${Messages.SEEDER.ADMIN_SEEDED}`);
      console.log(`- Email: ${adminEmail}`);
      console.log(`- Password: ${adminPassword}`);
    } else {
      console.log(`[Seeder] ${Messages.SEEDER.ADMIN_EXISTS}`);
    }
  } catch (error: any) {
    console.error('[Seeder] Error seeding admin account:', error.message);
  }
};
