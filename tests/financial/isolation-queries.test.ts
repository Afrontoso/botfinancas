/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../setup';
import {
  sumByPeriod,
  listByCategory,
  listRecent,
  computeBalance,
} from '../../src/financial/queries';

describe('multi-user isolation in queries', () => {
  let userA: string;
  let userB: string;

  beforeEach(async () => {
    const a = await prisma.user.create({
      data: { telegramUserId: 'iso-A', name: 'User A' },
    });
    userA = a.id;
    const b = await prisma.user.create({
      data: { telegramUserId: 'iso-B', name: 'User B' },
    });
    userB = b.id;

    const catA = await prisma.category.create({
      data: { userId: userA, name: 'Mercado A', type: 'expense' },
    });
    const catB = await prisma.category.create({
      data: { userId: userB, name: 'Mercado B', type: 'expense' },
    });

    await prisma.transaction.createMany({
      data: [
        // User A: 3 transactions
        { userId: userA, categoryId: catA.id, type: 'expense', amount: 100, currency: 'BRL', description: 'A1', transactionDate: new Date('2026-05-01') },
        { userId: userA, categoryId: catA.id, type: 'expense', amount: 50, currency: 'BRL', description: 'A2', transactionDate: new Date('2026-05-02') },
        { userId: userA, type: 'income', amount: 2000, currency: 'BRL', description: 'A income', transactionDate: new Date('2026-05-03') },
        // User B: 3 transactions
        { userId: userB, categoryId: catB.id, type: 'expense', amount: 999, currency: 'BRL', description: 'B1', transactionDate: new Date('2026-05-01') },
        { userId: userB, categoryId: catB.id, type: 'expense', amount: 333, currency: 'BRL', description: 'B2', transactionDate: new Date('2026-05-02') },
        { userId: userB, type: 'income', amount: 8000, currency: 'BRL', description: 'B income', transactionDate: new Date('2026-05-03') },
      ],
    });
  });

  it('sumByPeriod isolates by userId', async () => {
    expect(await sumByPeriod(prisma, userA, 'expense')).toBe(150);
    expect(await sumByPeriod(prisma, userB, 'expense')).toBe(1332);
    expect(await sumByPeriod(prisma, userA, 'income')).toBe(2000);
    expect(await sumByPeriod(prisma, userB, 'income')).toBe(8000);
  });

  it('listByCategory does not mix categories across users', async () => {
    const a = await listByCategory(prisma, userA, 'expense');
    const b = await listByCategory(prisma, userB, 'expense');
    expect(a.map((r) => r.categoryName)).toEqual(['Mercado A']);
    expect(b.map((r) => r.categoryName)).toEqual(['Mercado B']);
  });

  it('listRecent returns only the requested user', async () => {
    const a = await listRecent(prisma, userA, 10);
    const b = await listRecent(prisma, userB, 10);
    expect(a.every((t) => t.userId === userA)).toBe(true);
    expect(b.every((t) => t.userId === userB)).toBe(true);
    expect(a).toHaveLength(3);
    expect(b).toHaveLength(3);
  });

  it('computeBalance is scoped per user', async () => {
    const a = await computeBalance(prisma, userA);
    const b = await computeBalance(prisma, userB);
    expect(a).toEqual({ income: 2000, expense: 150, net: 1850 });
    expect(b).toEqual({ income: 8000, expense: 1332, net: 6668 });
  });
});
