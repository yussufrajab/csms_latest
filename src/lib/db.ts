import { PrismaClient } from '@prisma/client';
import { dbLogger } from '@/lib/logger';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      { emit: 'event', level: 'error' },
    ],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const db = globalThis.prisma ?? prismaClientSingleton();

db.$on('error', (e) => {
  dbLogger.error({ err: e }, 'Prisma error');
});

export { db };

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}