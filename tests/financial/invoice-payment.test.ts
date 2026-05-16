/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../setup';
import { payInvoice } from '../../src/financial/invoice-payment';

describe('payInvoice', () => {
  let userId: string;
  let cardAccountId: string;
  let invoiceId: string;
  let checkingAccountId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: { telegramUserId: '101010101', name: 'Invoice Pay User' },
    });
    userId = user.id;

    const card = await prisma.account.create({
      data: { userId, name: 'Nubank', type: 'credit_card', closingDay: 15, dueDay: 22 },
    });
    cardAccountId = card.id;

    const checking = await prisma.account.create({
      data: { userId, name: 'Conta Corrente', type: 'checking' },
    });
    checkingAccountId = checking.id;

    const invoice = await prisma.invoice.create({
      data: {
        accountId: cardAccountId,
        periodStart: new Date('2026-05-01'),
        periodEnd: new Date('2026-05-15'),
        dueDate: new Date('2026-05-22'),
        totalAmount: 500,
        paidAmount: 0,
        status: 'open',
      },
    });
    invoiceId = invoice.id;
  });

  it('records full payment: increments paidAmount and sets status=paid', async () => {
    const result = await payInvoice(prisma, userId, invoiceId, 500, {
      sourceAccountId: checkingAccountId,
    });

    expect(result.invoice.paidAmount.toString()).toBe('500');
    expect(result.invoice.status).toBe('paid');
    expect(result.transaction.type).toBe('transfer');

    const ip = await prisma.invoicePayment.findUnique({
      where: { transactionId: result.transaction.id },
    });
    expect(ip).not.toBeNull();
    expect(Number(ip?.amount)).toBe(500);
    expect(ip?.invoiceId).toBe(invoiceId);
  });

  it('records partial payment: status=partial when paidAmount < totalAmount', async () => {
    const result = await payInvoice(prisma, userId, invoiceId, 200, {
      sourceAccountId: checkingAccountId,
    });

    expect(Number(result.invoice.paidAmount)).toBe(200);
    expect(result.invoice.status).toBe('partial');
  });

  it('accumulates multiple partial payments atomically', async () => {
    await payInvoice(prisma, userId, invoiceId, 100, { sourceAccountId: checkingAccountId });
    await payInvoice(prisma, userId, invoiceId, 200, { sourceAccountId: checkingAccountId });
    const final = await payInvoice(prisma, userId, invoiceId, 200, {
      sourceAccountId: checkingAccountId,
    });

    expect(Number(final.invoice.paidAmount)).toBe(500);
    expect(final.invoice.status).toBe('paid');

    const payments = await prisma.invoicePayment.findMany({ where: { invoiceId } });
    expect(payments).toHaveLength(3);
  });

  it('throws when invoice does not exist', async () => {
    await expect(
      payInvoice(prisma, userId, 'nonexistent-invoice-id', 100, {
        sourceAccountId: checkingAccountId,
      }),
    ).rejects.toThrow(/invoice/i);
  });

  it('throws when invoice belongs to another user', async () => {
    const otherUser = await prisma.user.create({
      data: { telegramUserId: '999999999', name: 'Other' },
    });
    const otherCard = await prisma.account.create({
      data: { userId: otherUser.id, name: 'OtherCard', type: 'credit_card', closingDay: 1, dueDay: 10 },
    });
    const otherInvoice = await prisma.invoice.create({
      data: {
        accountId: otherCard.id,
        periodStart: new Date('2026-05-01'),
        periodEnd: new Date('2026-05-15'),
        dueDate: new Date('2026-05-22'),
        totalAmount: 100,
        status: 'open',
      },
    });

    await expect(
      payInvoice(prisma, userId, otherInvoice.id, 50, { sourceAccountId: checkingAccountId }),
    ).rejects.toThrow(/permission|user|owner/i);
  });
});
