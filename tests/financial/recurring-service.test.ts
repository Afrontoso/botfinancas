/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../setup';
import {
  createRecurring,
  listRecurring,
  toggleActive,
  findDueOn,
} from '../../src/financial/recurring-service';

describe('recurring-service', () => {
  let userId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: { telegramUserId: '4040', name: 'Recurring User' },
    });
    userId = user.id;
  });

  describe('createRecurring', () => {
    it('creates a new RecurringExpense', async () => {
      const rec = await createRecurring(prisma, {
        userId,
        name: 'Aluguel',
        expectedAmount: 1500,
        periodicity: 'monthly',
        expectedDay: 5,
      });
      expect(rec.id).toBeTruthy();
      expect(rec.name).toBe('Aluguel');
      expect(Number(rec.expectedAmount)).toBe(1500);
      expect(rec.active).toBe(true);
    });

    it('respects optional categoryId', async () => {
      const cat = await prisma.category.create({
        data: { userId, name: 'Moradia', type: 'expense' },
      });
      const rec = await createRecurring(prisma, {
        userId,
        name: 'Internet',
        expectedAmount: 100,
        periodicity: 'monthly',
        expectedDay: 10,
        categoryId: cat.id,
      });
      expect(rec.categoryId).toBe(cat.id);
    });
  });

  describe('listRecurring', () => {
    it('lists only own user recurrings', async () => {
      const otherUser = await prisma.user.create({
        data: { telegramUserId: '5050', name: 'Other' },
      });
      await createRecurring(prisma, {
        userId,
        name: 'A',
        expectedAmount: 100,
        periodicity: 'monthly',
        expectedDay: 1,
      });
      await createRecurring(prisma, {
        userId: otherUser.id,
        name: 'B',
        expectedAmount: 200,
        periodicity: 'monthly',
        expectedDay: 1,
      });

      const list = await listRecurring(prisma, userId);
      expect(list).toHaveLength(1);
      expect(list[0]?.name).toBe('A');
    });
  });

  describe('toggleActive', () => {
    it('disables an active recurring', async () => {
      const rec = await createRecurring(prisma, {
        userId,
        name: 'Aluguel',
        expectedAmount: 1500,
        periodicity: 'monthly',
        expectedDay: 5,
      });
      const updated = await toggleActive(prisma, rec.id, false);
      expect(updated.active).toBe(false);
    });
  });

  describe('findDueOn', () => {
    it('returns active recurrings whose expectedDay matches', async () => {
      await createRecurring(prisma, {
        userId,
        name: 'A-dia5',
        expectedAmount: 100,
        periodicity: 'monthly',
        expectedDay: 5,
      });
      await createRecurring(prisma, {
        userId,
        name: 'A-dia10',
        expectedAmount: 200,
        periodicity: 'monthly',
        expectedDay: 10,
      });
      const inactive = await createRecurring(prisma, {
        userId,
        name: 'A-dia5-inactive',
        expectedAmount: 50,
        periodicity: 'monthly',
        expectedDay: 5,
      });
      await toggleActive(prisma, inactive.id, false);

      const due = await findDueOn(prisma, userId, 5);
      expect(due).toHaveLength(1);
      expect(due[0]?.name).toBe('A-dia5');
    });
  });
});
