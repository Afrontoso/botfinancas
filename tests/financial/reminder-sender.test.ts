/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '../setup';
import { sendReminder, formatReminderMessage } from '../../src/financial/reminder-sender';
import type { Reminder, User } from '@prisma/client';

describe('reminder-sender', () => {
  let user: User;

  beforeEach(async () => {
    user = await prisma.user.create({
      data: { telegramUserId: '8080', name: 'Sender User' },
    });
  });

  async function makeReminder(overrides: Partial<Reminder> = {}): Promise<Reminder> {
    return prisma.reminder.create({
      data: {
        userId: user.id,
        type: 'custom',
        scheduledFor: new Date('2026-05-17T10:00:00Z'),
        payload: { message: 'Lembrete genérico' },
        ...overrides,
      },
    });
  }

  describe('formatReminderMessage', () => {
    it('formata recurring_missing usando recurringName e expectedAmount', () => {
      const msg = formatReminderMessage({
        type: 'recurring_missing',
        payload: { recurringName: 'Aluguel', expectedAmount: 1500, expectedDay: 5 },
      });
      expect(msg).toContain('Aluguel');
      expect(msg).toContain('1500');
    });

    it('formata invoice_due usando accountName, totalAmount e dueDate', () => {
      const msg = formatReminderMessage({
        type: 'invoice_due',
        payload: { accountName: 'Nubank', totalAmount: 1234.56, dueDate: '2026-05-20' },
      });
      expect(msg).toContain('Nubank');
      expect(msg).toContain('1234.56');
      expect(msg).toContain('2026-05-20');
    });

    it('usa payload.message para type=custom', () => {
      const msg = formatReminderMessage({ type: 'custom', payload: { message: 'Oi!' } });
      expect(msg).toContain('Oi!');
    });
  });

  describe('sendReminder', () => {
    it('chama o sender e marca o reminder como enviado', async () => {
      const reminder = await makeReminder();
      const send = vi.fn().mockResolvedValue(undefined);

      await sendReminder(prisma, send, reminder, user);

      expect(send).toHaveBeenCalledTimes(1);
      expect(send).toHaveBeenCalledWith('8080', expect.stringContaining('Lembrete'));

      const updated = await prisma.reminder.findUnique({ where: { id: reminder.id } });
      expect(updated?.status).toBe('sent');
      expect(updated?.sentAt).not.toBeNull();
    });

    it('mantém status=pending quando o envio falha (retry futuro)', async () => {
      const reminder = await makeReminder();
      const send = vi.fn().mockRejectedValue(new Error('Telegram 500'));

      await expect(sendReminder(prisma, send, reminder, user)).rejects.toThrow('Telegram 500');

      const stillPending = await prisma.reminder.findUnique({ where: { id: reminder.id } });
      expect(stillPending?.status).toBe('pending');
      expect(stillPending?.sentAt).toBeNull();
    });
  });
});
