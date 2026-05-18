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
  // makeLlmClient() lança se nada estiver configurado. Testes que importam o
  // webhook handler precisam de uma chave qualquer pra construir o cliente —
  // o complete() em si é sempre mockado via fetch ou via processMessage stub.
  if (!process.env['GEMINI_API_KEY'] && !process.env['OLLAMA_BASE_URL']) {
    process.env['GEMINI_API_KEY'] = 'test-stub-key';
  }
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
      "FinancialAccount",
      "Contact",
      "Session",
      "Account",
      "VerificationToken",
      "User"
    RESTART IDENTITY CASCADE
  `);
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
