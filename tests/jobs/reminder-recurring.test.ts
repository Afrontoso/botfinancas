/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../setup';
import { generateRecurringReminders } from '../../src/jobs/reminder-recurring';

describe('generateRecurringReminders', () => {
  let userId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: { telegramUserId: '6060', name: 'Reminder User' },
    });
    userId = user.id;
  });

  it('creates a Reminder for an active recurring whose expectedDay already passed without a matching Transaction', async () => {
    await prisma.recurringExpense.create({
      data: {
        userId,
        name: 'Aluguel',
        expectedAmount: 1500,
        periodicity: 'monthly',
        expectedDay: 5,
      },
    });

    // today = day 10 of month, expectedDay = 5, no Transaction registered → should generate Reminder
    const today = new Date('2026-05-10T12:00:00Z');
    const reminders = await generateRecurringReminders(prisma, today);

    expect(reminders).toHaveLength(1);
    expect(reminders[0]?.userId).toBe(userId);
    expect(reminders[0]?.type).toBe('recurring_missing');
  });

  it('does NOT create Reminder when a matching Transaction exists this month', async () => {
    const rec = await prisma.recurringExpense.create({
      data: {
        userId,
        name: 'Aluguel',
        expectedAmount: 1500,
        periodicity: 'monthly',
        expectedDay: 5,
      },
    });
    await prisma.transaction.create({
      data: {
        userId,
        type: 'expense',
        amount: 1500,
        currency: 'BRL',
        description: 'Aluguel pago',
        transactionDate: new Date('2026-05-06'),
      },
    });

    const today = new Date('2026-05-10T12:00:00Z');
    const reminders = await generateRecurringReminders(prisma, today);

    expect(reminders).toHaveLength(0);
    void rec;
  });

  it('is idempotent: running twice does not duplicate Reminders for the same recurring/month', async () => {
    await prisma.recurringExpense.create({
      data: {
        userId,
        name: 'Aluguel',
        expectedAmount: 1500,
        periodicity: 'monthly',
        expectedDay: 5,
      },
    });

    const today = new Date('2026-05-10T12:00:00Z');
    const first = await generateRecurringReminders(prisma, today);
    const second = await generateRecurringReminders(prisma, today);

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(0);

    const all = await prisma.reminder.findMany({ where: { userId } });
    expect(all).toHaveLength(1);
  });

  it('does NOT create Reminder when expectedDay is in the future', async () => {
    await prisma.recurringExpense.create({
      data: {
        userId,
        name: 'Internet',
        expectedAmount: 100,
        periodicity: 'monthly',
        expectedDay: 25,
      },
    });

    const today = new Date('2026-05-10T12:00:00Z');
    const reminders = await generateRecurringReminders(prisma, today);

    expect(reminders).toHaveLength(0);
  });

  it('ignores inactive recurrings', async () => {
    await prisma.recurringExpense.create({
      data: {
        userId,
        name: 'Aluguel',
        expectedAmount: 1500,
        periodicity: 'monthly',
        expectedDay: 5,
        active: false,
      },
    });

    const today = new Date('2026-05-10T12:00:00Z');
    const reminders = await generateRecurringReminders(prisma, today);

    expect(reminders).toHaveLength(0);
  });
});
