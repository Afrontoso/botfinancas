import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function buildClient(): PrismaClient {
  const isVitest = !!process.env['VITEST_WORKER_ID'] || !!process.env['VITEST_POOL_ID'];
  const testUrl = process.env['TEST_DATABASE_URL'];
  if (isVitest && testUrl) {
    return new PrismaClient({ datasources: { db: { url: testUrl } } });
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? buildClient();

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}
