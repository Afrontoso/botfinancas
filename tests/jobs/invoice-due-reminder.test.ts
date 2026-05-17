/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../setup';
import { generateInvoiceDueReminders } from '../../src/jobs/invoice-due-reminder';

describe('generateInvoiceDueReminders', () => {
  let userId: string;
  let accountId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: { telegramUserId: '9090', name: 'Invoice User' },
    });
    userId = user.id;
    const acc = await prisma.financialAccount.create({
      data: {
        userId,
        name: 'Nubank',
        type: 'credit_card',
        closingDay: 5,
        dueDay: 15,
      },
    });
    accountId = acc.id;
  });

  async function makeInvoice(dueDate: Date, status: 'open' | 'closed' | 'partial' | 'paid', total = 1000) {
    return prisma.invoice.create({
      data: {
        accountId,
        periodStart: new Date('2026-04-06'),
        periodEnd: new Date('2026-05-05'),
        dueDate,
        totalAmount: total,
        status,
      },
    });
  }

  it('cria Reminder para invoice com dueDate dentro da janela [today, today+3]', async () => {
    const today = new Date('2026-05-17T08:00:00Z');
    await makeInvoice(new Date('2026-05-19'), 'closed');
    const reminders = await generateInvoiceDueReminders(prisma, today);
    expect(reminders).toHaveLength(1);
    expect(reminders[0]?.type).toBe('invoice_due');
    const payload = reminders[0]?.payload as { accountName: string; dueDate: string };
    expect(payload.accountName).toBe('Nubank');
    expect(payload.dueDate).toBe('2026-05-19');
  });

  it('ignora invoice paga (status=paid)', async () => {
    const today = new Date('2026-05-17T08:00:00Z');
    await makeInvoice(new Date('2026-05-19'), 'paid');
    const reminders = await generateInvoiceDueReminders(prisma, today);
    expect(reminders).toHaveLength(0);
  });

  it('ignora invoice fora da janela (dueDate > today+3)', async () => {
    const today = new Date('2026-05-17T08:00:00Z');
    await makeInvoice(new Date('2026-05-25'), 'open');
    const reminders = await generateInvoiceDueReminders(prisma, today);
    expect(reminders).toHaveLength(0);
  });

  it('ignora invoice fora da janela (dueDate < today)', async () => {
    const today = new Date('2026-05-17T08:00:00Z');
    await makeInvoice(new Date('2026-05-15'), 'open');
    const reminders = await generateInvoiceDueReminders(prisma, today);
    expect(reminders).toHaveLength(0);
  });

  it('é idempotente: rodar duas vezes não duplica reminders', async () => {
    const today = new Date('2026-05-17T08:00:00Z');
    await makeInvoice(new Date('2026-05-18'), 'closed');
    const first = await generateInvoiceDueReminders(prisma, today);
    const second = await generateInvoiceDueReminders(prisma, today);
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(0);
    const all = await prisma.reminder.findMany({ where: { userId, type: 'invoice_due' } });
    expect(all).toHaveLength(1);
  });
});
