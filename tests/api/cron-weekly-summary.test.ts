/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { prisma } from '../setup';

vi.mock('../../src/webhook/reply', () => ({
  sendMessage: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from '../../src/app/api/cron/weekly-summary/route';
import { sendMessage } from '../../src/webhook/reply';

const SECRET = 'cron-secret-67890';

function makeRequest(authHeader: string | null) {
  const headers: Record<string, string> = {};
  if (authHeader !== null) headers['authorization'] = authHeader;
  return new Request('http://test/api/cron/weekly-summary', { method: 'POST', headers });
}

describe('POST /api/cron/weekly-summary', () => {
  beforeEach(async () => {
    vi.stubEnv('CRON_SECRET', SECRET);
    vi.mocked(sendMessage).mockClear();
    vi.mocked(sendMessage).mockResolvedValue(undefined);
    await prisma.user.create({
      data: { telegramUserId: '4040', name: 'Summary User' },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejeita 401 sem auth válido', async () => {
    const res = await POST(makeRequest(null));
    expect(res.status).toBe(401);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('gera resumo, envia e retorna stats', async () => {
    const res = await POST(makeRequest(`Bearer ${SECRET}`));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { createdCount: number; sent: number };
    expect(body.createdCount).toBe(1);
    expect(body.sent).toBe(1);
    expect(sendMessage).toHaveBeenCalledWith('4040', expect.stringContaining('Resumo da semana'));
  });
});
