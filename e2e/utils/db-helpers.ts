import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export function getTestDb() {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  return prisma;
}

export async function cleanupTestData() {
  const db = getTestDb();

  // Delete in correct order to respect foreign keys
  await db.promotionRequest.deleteMany();
  await db.notification.deleteMany();
  await db.session.deleteMany();
  // AuditLog table has been migrated to audit.audit_log (separate schema)
  // Use raw SQL to clean up audit data if needed:
  // await db.$executeRaw`DELETE FROM audit.audit_log WHERE created_at > NOW() - INTERVAL '1 day'`;

  console.log('✅ Test data cleaned up');
}

export async function disconnectTestDb() {
  if (prisma) {
    await prisma.$disconnect();
  }
}
