import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPasswords() {
  try {
    const newPassword = 'Csms@2026';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const users = await prisma.user.findMany({
      select: { id: true, username: true },
    });

    console.log(`Found ${users.length} users. Resetting all passwords to: ${newPassword}`);

    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordExpiresAt: null,
          failedLoginAttempts: 0,
          loginLockedUntil: null,
          lastPasswordChange: new Date(),
          isTemporaryPassword: false,
          mustChangePassword: false,
        },
      });
      console.log(`✓ Reset password for ${user.username}`);
    }

    console.log(`\nDone. ${users.length} users reset to password: ${newPassword}`);
  } catch (error) {
    console.error('Error resetting passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPasswords();