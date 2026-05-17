/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../setup';
import { generateWeeklySummaryReminders } from '../../src/jobs/weekly-summary';

describe('generateWeeklySummaryReminders', () => {
  let userId: string;
  let foodCategoryId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: { telegramUserId: '5050', name: 'Weekly User' },
    });
    userId = user.id;
    const food = await prisma.category.create({
      data: { userId, name: 'Alimentação', type: 'expense' },
    });
    foodCategoryId = food.id;
    const transport = await prisma.category.create({
      data: { userId, name: 'Transporte', type: 'expense' },
    });

    // hoje = 2026-05-17 (domingo); semana = 2026-05-10 → 2026-05-17
    await prisma.transaction.createMany({
      data: [
        {
          userId,
          categoryId: foodCategoryId,
          type: 'expense',
          amount: 100,
          currency: 'BRL',
          description: 'Mercado',
          transactionDate: new Date('2026-05-12'),
        },
        {
          userId,
          categoryId: transport.id,
          type: 'expense',
          amount: 50,
          currency: 'BRL',
          description: 'Uber',
          transactionDate: new Date('2026-05-14'),
        },
        {
          userId,
          type: 'income',
          amount: 3000,
          currency: 'BRL',
          description: 'Salário',
          transactionDate: new Date('2026-05-15'),
        },
        // fora da janela — não deve entrar
        {
          userId,
          categoryId: foodCategoryId,
          type: 'expense',
          amount: 999,
          currency: 'BRL',
          description: 'Antes',
          transactionDate: new Date('2026-05-01'),
        },
      ],
    });
  });

  it('cria um Reminder com income, expense, net e top categorias', async () => {
    const today = new Date('2026-05-17T20:00:00Z');
    const reminders = await generateWeeklySummaryReminders(prisma, today);
    expect(reminders).toHaveLength(1);
    const r = reminders[0]!;
    expect(r.type).toBe('custom');
    const p = r.payload as {
      kind: string;
      income: number;
      expense: number;
      net: number;
      message: string;
      topCategories: { name: string; total: number }[];
    };
    expect(p.kind).toBe('weekly_summary');
    expect(p.income).toBe(3000);
    expect(p.expense).toBe(150);
    expect(p.net).toBe(2850);
    expect(p.topCategories[0]?.name).toBe('Alimentação');
    expect(p.topCategories[0]?.total).toBe(100);
    expect(p.message).toContain('Resumo da semana');
    expect(p.message).toContain('R$ 3000.00');
    expect(p.message).toContain('Alimentação');
  });

  it('é idempotente no mesmo dia', async () => {
    const today = new Date('2026-05-17T20:00:00Z');
    const first = await generateWeeklySummaryReminders(prisma, today);
    const second = await generateWeeklySummaryReminders(prisma, today);
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(0);
  });

  it('gera um Reminder por usuário', async () => {
    await prisma.user.create({ data: { telegramUserId: '5051', name: 'Outro' } });
    const today = new Date('2026-05-17T20:00:00Z');
    const reminders = await generateWeeklySummaryReminders(prisma, today);
    expect(reminders).toHaveLength(2);
  });
});
