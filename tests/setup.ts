/// <reference types="vitest/globals" />
import { PrismaClient } from '@prisma/client';
import { execSync } from 'node:child_process';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env['TEST_DATABASE_URL'] } },
});

beforeAll(() => {
  execSync('pnpm prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env['TEST_DATABASE_URL'] },
  });
});

beforeEach(async () => {
  await prisma.$executeRawUnsafe(`
    TRUNCATE
      "Reminder",
      "Budget",
      "RecurringExpense",
      "SplitSettlement",
      "SharedSplit",
      "InvoicePayment",
      "Invoice",
      "AiInference",
      "MessageLog",
      "Transaction",
      "MemoryEntry",
      "Category",
      "Account",
      "Contact",
      "User"
    RESTART IDENTITY CASCADE
  `);
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
