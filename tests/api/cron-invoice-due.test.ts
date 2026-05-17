/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { prisma } from '../setup';

vi.mock('../../src/webhook/reply', () => ({
  sendMessage: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from '../../src/app/api/cron/invoice-due/route';
import { sendMessage } from '../../src/webhook/reply';

const SECRET = 'cron-secret-12345';

function makeRequest(authHeader: string | null) {
  const headers: Record<string, string> = {};
  if (authHeader !== null) headers['authorization'] = authHeader;
  return new Request('http://test/api/cron/invoice-due', { method: 'POST', headers });
}

describe('POST /api/cron/invoice-due', () => {
  let userId: string;

  beforeEach(async () => {
    vi.stubEnv('CRON_SECRET', SECRET);
    vi.mocked(sendMessage).mockClear();
    vi.mocked(sendMessage).mockResolvedValue(undefined);

    const user = await prisma.user.create({
      data: { telegramUserId: '7777', name: 'Cron User' },
    });
    userId = user.id;
    const acc = await prisma.financialAccount.create({
      data: {
        userId,
        name: 'Itaú',
        type: 'credit_card',
        closingDay: 5,
        dueDay: 15,
      },
    });
    // fatura vencendo amanhã
    await prisma.invoice.create({
      data: {
        accountId: acc.id,
        periodStart: new Date('2026-04-06'),
        periodEnd: new Date('2026-05-05'),
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        totalAmount: 800,
        status: 'closed',
      },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('retorna 401 sem header de auth', async () => {
    const res = await POST(makeRequest(null));
    expect(res.status).toBe(401);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('retorna 401 com secret errado', async () => {
    const res = await POST(makeRequest('Bearer wrong'));
    expect(res.status).toBe(401);
  });

  it('gera reminder, envia mensagem e retorna stats', async () => {
    const res = await POST(makeRequest(`Bearer ${SECRET}`));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { createdCount: number; sent: number; failed: number };
    expect(body.createdCount).toBe(1);
    expect(body.sent).toBe(1);
    expect(body.failed).toBe(0);
    expect(sendMessage).toHaveBeenCalledWith('7777', expect.stringContaining('Itaú'));

    const reminders = await prisma.reminder.findMany({ where: { userId } });
    expect(reminders).toHaveLength(1);
    expect(reminders[0]?.status).toBe('sent');
  });

  it('é idempotente quando rodado de novo (não recria reminder)', async () => {
    await POST(makeRequest(`Bearer ${SECRET}`));
    vi.mocked(sendMessage).mockClear();
    const res2 = await POST(makeRequest(`Bearer ${SECRET}`));
    const body2 = (await res2.json()) as { createdCount: number; sent: number };
    expect(body2.createdCount).toBe(0);
    expect(body2.sent).toBe(0); // nada pending pra enviar
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
