/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../setup';
import {
  sumByPeriod,
  listByCategory,
  listRecent,
  computeBalance,
  listTransactionsPaginated,
} from '../../src/financial/queries';

describe('queries', () => {
  let userId: string;
  let foodCategoryId: string;
  let transportCategoryId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: { telegramUserId: '321321321', name: 'Query Test User' },
    });
    userId = user.id;

    const food = await prisma.category.create({
      data: { userId, name: 'Alimentação', type: 'expense' },
    });
    foodCategoryId = food.id;

    const transport = await prisma.category.create({
      data: { userId, name: 'Transporte', type: 'expense' },
    });
    transportCategoryId = transport.id;

    // Seed de transações ao longo de maio/2026
    await prisma.transaction.createMany({
      data: [
        {
          userId,
          categoryId: foodCategoryId,
          type: 'expense',
          amount: 50,
          currency: 'BRL',
          description: 'Mercado',
          transactionDate: new Date('2026-05-01'),
        },
        {
          userId,
          categoryId: foodCategoryId,
          type: 'expense',
          amount: 30,
          currency: 'BRL',
          description: 'Padaria',
          transactionDate: new Date('2026-05-05'),
        },
        {
          userId,
          categoryId: transportCategoryId,
          type: 'expense',
          amount: 20,
          currency: 'BRL',
          description: 'Uber',
          transactionDate: new Date('2026-05-10'),
        },
        {
          userId,
          type: 'income',
          amount: 3000,
          currency: 'BRL',
          description: 'Salário',
          transactionDate: new Date('2026-05-05'),
        },
        // transação de abril (fora do período de maio)
        {
          userId,
          categoryId: foodCategoryId,
          type: 'expense',
          amount: 100,
          currency: 'BRL',
          description: 'Mercado abril',
          transactionDate: new Date('2026-04-15'),
        },
      ],
    });
  });

  describe('sumByPeriod', () => {
    it('sums expenses within the period', async () => {
      const total = await sumByPeriod(prisma, userId, 'expense', new Date('2026-05-01'), new Date('2026-05-31'));
      expect(total).toBe(100); // 50 + 30 + 20
    });

    it('sums income within the period', async () => {
      const total = await sumByPeriod(prisma, userId, 'income', new Date('2026-05-01'), new Date('2026-05-31'));
      expect(total).toBe(3000);
    });

    it('returns 0 when no transactions match', async () => {
      const total = await sumByPeriod(prisma, userId, 'expense', new Date('2027-01-01'), new Date('2027-01-31'));
      expect(total).toBe(0);
    });

    it('sums all expenses when no period given', async () => {
      const total = await sumByPeriod(prisma, userId, 'expense');
      expect(total).toBe(200); // 50 + 30 + 20 + 100 (April)
    });
  });

  describe('listByCategory', () => {
    it('groups expenses by category in period', async () => {
      const result = await listByCategory(prisma, userId, 'expense', new Date('2026-05-01'), new Date('2026-05-31'));
      expect(result).toHaveLength(2);
      const food = result.find((r) => r.categoryName === 'Alimentação');
      expect(food?.total).toBe(80);
      expect(food?.count).toBe(2);
      const transport = result.find((r) => r.categoryName === 'Transporte');
      expect(transport?.total).toBe(20);
      expect(transport?.count).toBe(1);
    });

    it('returns empty array when no transactions in period', async () => {
      const result = await listByCategory(prisma, userId, 'expense', new Date('2027-01-01'), new Date('2027-01-31'));
      expect(result).toEqual([]);
    });
  });

  describe('listRecent', () => {
    it('returns most recent transactions sorted by date desc', async () => {
      const result = await listRecent(prisma, userId, 3);
      expect(result).toHaveLength(3);
      expect(result[0]?.description).toBe('Uber'); // 2026-05-10 — most recent
      const dates = result.map((t) => t.transactionDate.toISOString().slice(0, 10));
      expect(dates).toEqual(['2026-05-10', '2026-05-05', '2026-05-05']);
    });

    it('respects the limit parameter', async () => {
      const result = await listRecent(prisma, userId, 2);
      expect(result).toHaveLength(2);
    });
  });

  describe('listTransactionsPaginated', () => {
    it('returns items and total count without filter', async () => {
      const result = await listTransactionsPaginated(prisma, userId, 0, 10);
      expect(result.total).toBe(5);
      expect(result.items).toHaveLength(5);
      // ordenado por transactionDate desc
      expect(result.items[0]?.description).toBe('Uber'); // 2026-05-10
    });

    it('paginates with offset and limit', async () => {
      const first = await listTransactionsPaginated(prisma, userId, 0, 2);
      const second = await listTransactionsPaginated(prisma, userId, 2, 2);
      expect(first.items).toHaveLength(2);
      expect(second.items).toHaveLength(2);
      expect(first.items[0]?.id).not.toBe(second.items[0]?.id);
      expect(first.total).toBe(5);
      expect(second.total).toBe(5);
    });

    it('filters by type', async () => {
      const result = await listTransactionsPaginated(prisma, userId, 0, 10, { type: 'income' });
      expect(result.total).toBe(1);
      expect(result.items[0]?.description).toBe('Salário');
    });

    it('filters by categoryId', async () => {
      const result = await listTransactionsPaginated(prisma, userId, 0, 10, {
        categoryId: foodCategoryId,
      });
      expect(result.total).toBe(3); // 2 May + 1 April
      expect(result.items.every((t) => t.categoryId === foodCategoryId)).toBe(true);
    });

    it('includes category relation', async () => {
      const result = await listTransactionsPaginated(prisma, userId, 0, 1, {
        categoryId: transportCategoryId,
      });
      expect(result.items[0]?.category?.name).toBe('Transporte');
    });
  });

  describe('computeBalance', () => {
    it('returns income, expense and net for the period', async () => {
      const result = await computeBalance(prisma, userId, new Date('2026-05-01'), new Date('2026-05-31'));
      expect(result.income).toBe(3000);
      expect(result.expense).toBe(100);
      expect(result.net).toBe(2900);
    });

    it('returns zeros when no transactions exist for period', async () => {
      const result = await computeBalance(prisma, userId, new Date('2027-01-01'), new Date('2027-01-31'));
      expect(result).toEqual({ income: 0, expense: 0, net: 0 });
    });
  });
});
