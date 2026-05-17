/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../setup';
import {
  createReminder,
  listPending,
  markSent,
  findDue,
} from '../../src/financial/reminder-service';

describe('reminder-service', () => {
  let userId: string;
  let otherUserId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: { telegramUserId: '7070', name: 'Reminder Svc User' },
    });
    userId = user.id;
    const other = await prisma.user.create({
      data: { telegramUserId: '7071', name: 'Outro' },
    });
    otherUserId = other.id;
  });

  describe('createReminder', () => {
    it('persiste um Reminder com status pending por padrão', async () => {
      const r = await createReminder(prisma, {
        userId,
        type: 'custom',
        scheduledFor: new Date('2026-05-17T10:00:00Z'),
        payload: { message: 'oi' },
      });
      expect(r.status).toBe('pending');
      expect(r.userId).toBe(userId);
      expect(r.type).toBe('custom');
      expect(r.payload).toEqual({ message: 'oi' });
    });
  });

  describe('listPending', () => {
    it('retorna só os Reminders pending do usuário, ordenados por scheduledFor asc', async () => {
      await createReminder(prisma, {
        userId,
        type: 'custom',
        scheduledFor: new Date('2026-05-20T10:00:00Z'),
        payload: { i: 2 },
      });
      await createReminder(prisma, {
        userId,
        type: 'custom',
        scheduledFor: new Date('2026-05-17T10:00:00Z'),
        payload: { i: 1 },
      });
      // de outro user — não deve aparecer
      await createReminder(prisma, {
        userId: otherUserId,
        type: 'custom',
        scheduledFor: new Date('2026-05-17T10:00:00Z'),
        payload: { i: 999 },
      });
      // já enviado — não deve aparecer
      const sent = await createReminder(prisma, {
        userId,
        type: 'custom',
        scheduledFor: new Date('2026-05-15T10:00:00Z'),
        payload: { i: 0 },
      });
      await markSent(prisma, sent.id);

      const pending = await listPending(prisma, userId);
      expect(pending).toHaveLength(2);
      expect((pending[0]?.payload as { i: number }).i).toBe(1);
      expect((pending[1]?.payload as { i: number }).i).toBe(2);
    });
  });

  describe('markSent', () => {
    it('marca status=sent e seta sentAt', async () => {
      const r = await createReminder(prisma, {
        userId,
        type: 'custom',
        scheduledFor: new Date('2026-05-17T10:00:00Z'),
        payload: {},
      });
      const before = new Date();
      const updated = await markSent(prisma, r.id);
      expect(updated.status).toBe('sent');
      expect(updated.sentAt).not.toBeNull();
      expect(updated.sentAt!.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
    });
  });

  describe('findDue', () => {
    it('retorna apenas Reminders pending com scheduledFor <= now (todos os users)', async () => {
      await createReminder(prisma, {
        userId,
        type: 'custom',
        scheduledFor: new Date('2026-05-10T10:00:00Z'),
        payload: { tag: 'venceu' },
      });
      await createReminder(prisma, {
        userId,
        type: 'custom',
        scheduledFor: new Date('2026-05-30T10:00:00Z'),
        payload: { tag: 'futuro' },
      });
      // pending mas de outro user — TAMBÉM aparece (findDue é global pro sender)
      await createReminder(prisma, {
        userId: otherUserId,
        type: 'custom',
        scheduledFor: new Date('2026-05-10T10:00:00Z'),
        payload: { tag: 'outro-vencido' },
      });
      // já enviado — não aparece
      const sent = await createReminder(prisma, {
        userId,
        type: 'custom',
        scheduledFor: new Date('2026-05-01T10:00:00Z'),
        payload: { tag: 'enviado' },
      });
      await markSent(prisma, sent.id);

      const due = await findDue(prisma, new Date('2026-05-17T12:00:00Z'));
      const tags = due.map((r) => (r.payload as { tag: string }).tag).sort();
      expect(tags).toEqual(['outro-vencido', 'venceu']);
    });
  });
});
