/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../setup';
import { handleQuery } from '../../src/financial/query-handler';
import { FakeLlmClient } from '../../src/ai/fake-llm-client';

describe('handleQuery', () => {
  let userId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: { telegramUserId: '888777666', name: 'Query Handler User' },
    });
    userId = user.id;

    const food = await prisma.category.create({
      data: { userId, name: 'Mercado', type: 'expense' },
    });

    await prisma.transaction.createMany({
      data: [
        {
          userId,
          categoryId: food.id,
          type: 'expense',
          amount: 50,
          currency: 'BRL',
          description: 'Mercado',
          transactionDate: new Date('2026-05-01'),
        },
        {
          userId,
          categoryId: food.id,
          type: 'expense',
          amount: 30,
          currency: 'BRL',
          description: 'Padaria',
          transactionDate: new Date('2026-05-05'),
        },
        {
          userId,
          type: 'income',
          amount: 3000,
          currency: 'BRL',
          description: 'Salário',
          transactionDate: new Date('2026-05-05'),
        },
      ],
    });
  });

  it('handles balance query for a period', async () => {
    const llm = new FakeLlmClient([
      JSON.stringify({
        intent: 'query',
        queryType: 'balance',
        period: { from: '2026-05-01', to: '2026-05-31' },
        confidence: 0.95,
      }),
    ]);

    const reply = await handleQuery('quanto gastei esse mês?', userId, llm);
    expect(reply).toContain('Receitas');
    expect(reply).toContain('3000');
    expect(reply).toContain('Despesas');
    expect(reply).toContain('80');
    expect(reply).toContain('2920'); // net = 3000 - 80
  });

  it('handles expense_by_category query with category filter', async () => {
    const llm = new FakeLlmClient([
      JSON.stringify({
        intent: 'query',
        queryType: 'expense_by_category',
        category: 'Mercado',
        confidence: 0.9,
      }),
    ]);

    const reply = await handleQuery('quanto gastei com mercado?', userId, llm);
    expect(reply).toContain('Mercado');
    expect(reply).toContain('80'); // 50 + 30 = 80
  });

  it('handles recent_transactions query', async () => {
    const llm = new FakeLlmClient([
      JSON.stringify({
        intent: 'query',
        queryType: 'recent_transactions',
        confidence: 0.93,
      }),
    ]);

    const reply = await handleQuery('me mostra meus últimos gastos', userId, llm);
    expect(reply).toContain('Mercado');
    expect(reply).toContain('Padaria');
    expect(reply).toContain('Salário');
  });

  it('returns friendly message for unknown query type', async () => {
    const llm = new FakeLlmClient([
      JSON.stringify({
        intent: 'query',
        queryType: 'unknown',
        confidence: 0.5,
      }),
    ]);

    const reply = await handleQuery('blablabla', userId, llm);
    expect(reply.toLowerCase()).toContain('não entendi');
  });

  it('falls back gracefully when LLM returns a transaction intent for a query message', async () => {
    const llm = new FakeLlmClient([
      JSON.stringify({
        intent: 'create_transaction',
        type: 'expense',
        amount: 1,
        currency: 'BRL',
        description: 'x',
        transactionDate: '2026-05-01',
        confidence: 0.5,
      }),
    ]);

    const reply = await handleQuery('quanto gastei?', userId, llm);
    expect(reply.toLowerCase()).toContain('não entendi');
  });
});
