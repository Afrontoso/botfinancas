/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '../setup';
import {
  sendReminder,
  formatReminderMessage,
  processDueReminders,
} from '../../src/financial/reminder-sender';
import type { Prisma, Reminder, User } from '@prisma/client';

describe('reminder-sender', () => {
  let user: User;

  beforeEach(async () => {
    user = await prisma.user.create({
      data: { telegramUserId: '8080', name: 'Sender User' },
    });
  });

  async function makeReminder(
    overrides: Partial<Prisma.ReminderCreateInput> & { scheduledFor?: Date } = {},
  ): Promise<Reminder> {
    return prisma.reminder.create({
      data: {
        user: { connect: { id: user.id } },
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

  describe('processDueReminders', () => {
    it('envia todos os pendentes vencidos e marca como enviado', async () => {
      await makeReminder({ scheduledFor: new Date('2026-05-10T00:00:00Z') });
      await makeReminder({ scheduledFor: new Date('2026-05-15T00:00:00Z') });
      // ainda não venceu
      const future = await makeReminder({ scheduledFor: new Date('2026-06-01T00:00:00Z') });

      const send = vi.fn().mockResolvedValue(undefined);
      const result = await processDueReminders(prisma, send, new Date('2026-05-17T00:00:00Z'));

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
      expect(send).toHaveBeenCalledTimes(2);

      const futureStill = await prisma.reminder.findUnique({ where: { id: future.id } });
      expect(futureStill?.status).toBe('pending');
    });

    it('contabiliza falhas individuais sem interromper o loop', async () => {
      const r1 = await makeReminder({ scheduledFor: new Date('2026-05-10T00:00:00Z') });
      const r2 = await makeReminder({ scheduledFor: new Date('2026-05-11T00:00:00Z') });

      const send = vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('boom'));
      const result = await processDueReminders(prisma, send, new Date('2026-05-17T00:00:00Z'));

      expect(result.sent).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors[0]?.message).toBe('boom');

      // o que falhou continua pending
      const after1 = await prisma.reminder.findUnique({ where: { id: r1.id } });
      const after2 = await prisma.reminder.findUnique({ where: { id: r2.id } });
      // ordenamos por scheduledFor asc, então r1 é enviado primeiro (resolve), r2 falha
      expect(after1?.status).toBe('sent');
      expect(after2?.status).toBe('pending');
    });
  });
});
