/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../setup';
import { processMessage } from '../../src/financial/processor';
import { FakeLlmClient } from '../../src/ai/fake-llm-client';
import expenseSimple from '../../shared/fixtures/expense_simple.json';
import expenseWithCard from '../../shared/fixtures/expense_with_card.json';

describe('processMessage', () => {
  let userId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: { telegramUserId: '777888999', name: 'Processor Test User' },
    });
    userId = user.id;
  });

  it('creates a Transaction for a simple expense message', async () => {
    const llm = new FakeLlmClient([expenseSimple.llmRawResponse]);
    const result = await processMessage(expenseSimple.input.text, userId, llm);

    expect(result.type).toBe('created');
    expect(result.transaction).toBeDefined();
    expect(result.reply).toContain('50');

    const tx = await prisma.transaction.findFirst({ where: { userId } });
    expect(tx).not.toBeNull();
    expect(Number(tx?.amount)).toBe(50);
    expect(tx?.type).toBe('expense');
  });

  it('creates Transaction and increments Invoice.totalAmount atomically for card expense', async () => {
    const account = await prisma.account.create({
      data: {
        userId,
        name: 'Nubank',
        type: 'credit_card',
        closingDay: 15,
        dueDay: 22,
      },
    });
    const invoice = await prisma.invoice.create({
      data: {
        accountId: account.id,
        periodStart: new Date('2026-05-01'),
        periodEnd: new Date('2026-05-15'),
        dueDate: new Date('2026-05-22'),
        totalAmount: 0,
        status: 'open',
      },
    });

    const llm = new FakeLlmClient([expenseWithCard.llmRawResponse]);
    const result = await processMessage(expenseWithCard.input.text, userId, llm);

    expect(result.type).toBe('created');
    expect(result.transaction?.invoiceId).toBe(invoice.id);

    const updated = await prisma.invoice.findUnique({ where: { id: invoice.id } });
    expect(Number(updated?.totalAmount)).toBe(120);
  });

  it('returns query for a balance question', async () => {
    const llm = new FakeLlmClient([]);
    const result = await processMessage('quanto gastei esse mês?', userId, llm);
    expect(result.type).toBe('query');
    expect(result.transaction).toBeUndefined();
  });

  it('returns rejected when LLM returns invalid JSON', async () => {
    const llm = new FakeLlmClient(['isso não é json nenhum']);
    const result = await processMessage('gastei algo', userId, llm);
    expect(result.type).toBe('rejected');
    const tx = await prisma.transaction.findFirst({ where: { userId } });
    expect(tx).toBeNull();
  });
});
