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

  it('detects invoice payment and routes to payInvoice when open invoice exists', async () => {
    const account = await prisma.account.create({
      data: { userId, name: 'Nubank', type: 'credit_card', closingDay: 15, dueDay: 22 },
    });
    const invoice = await prisma.invoice.create({
      data: {
        accountId: account.id,
        periodStart: new Date('2026-05-01'),
        periodEnd: new Date('2026-05-15'),
        dueDate: new Date('2026-05-22'),
        totalAmount: 800,
        paidAmount: 0,
        status: 'open',
      },
    });

    const llm = new FakeLlmClient([
      JSON.stringify({
        intent: 'create_transaction',
        type: 'transfer',
        amount: 500,
        currency: 'BRL',
        description: 'Pagamento da fatura Nubank',
        transactionDate: '2026-05-16',
        paymentMethod: 'Nubank',
        isInvoicePayment: true,
        confidence: 0.97,
      }),
    ]);

    const result = await processMessage('paguei 500 da fatura do nubank', userId, llm);
    expect(result.type).toBe('created');
    expect(result.reply.toLowerCase()).toContain('pagamento');

    const updated = await prisma.invoice.findUnique({ where: { id: invoice.id } });
    expect(Number(updated?.paidAmount)).toBe(500);
    expect(updated?.status).toBe('partial');

    const ip = await prisma.invoicePayment.findFirst({ where: { invoiceId: invoice.id } });
    expect(ip).not.toBeNull();
    expect(Number(ip?.amount)).toBe(500);
  });

  it('creates a RecurringExpense when intent is create_recurring', async () => {
    const llm = new FakeLlmClient([
      JSON.stringify({
        intent: 'create_recurring',
        name: 'Aluguel',
        expectedAmount: 1500,
        currency: 'BRL',
        type: 'expense',
        category: 'Moradia',
        periodicity: 'monthly',
        expectedDay: 5,
        confidence: 0.96,
      }),
    ]);

    const result = await processMessage('Todo dia 5 pago 1500 de aluguel', userId, llm);
    expect(result.type).toBe('created');
    expect(result.reply.toLowerCase()).toContain('recorrente');

    const recs = await prisma.recurringExpense.findMany({ where: { userId } });
    expect(recs).toHaveLength(1);
    expect(recs[0]?.name).toBe('Aluguel');
    expect(Number(recs[0]?.expectedAmount)).toBe(1500);
    expect(recs[0]?.expectedDay).toBe(5);
  });

  it('falls back to normal Transaction when isInvoicePayment but no open invoice found', async () => {
    const llm = new FakeLlmClient([
      JSON.stringify({
        intent: 'create_transaction',
        type: 'transfer',
        amount: 300,
        currency: 'BRL',
        description: 'Pagamento da fatura Itaú',
        transactionDate: '2026-05-16',
        paymentMethod: 'Itaú',
        isInvoicePayment: true,
        confidence: 0.9,
      }),
    ]);

    const result = await processMessage('paguei 300 do cartao itau', userId, llm);
    expect(result.type).toBe('created');

    const tx = await prisma.transaction.findFirst({ where: { userId } });
    expect(tx).not.toBeNull();
    expect(tx?.invoiceId).toBeNull();

    const ip = await prisma.invoicePayment.findFirst();
    expect(ip).toBeNull();
  });
});
