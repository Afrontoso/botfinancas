/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '../setup';
import { POST } from '../../src/app/api/webhooks/telegram/route';

const VALID_SECRET = 'e2e-secret-token-xxxx';
const ALLOWED_USER_ID = '987654321';

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/webhooks/telegram', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-telegram-bot-api-secret-token': VALID_SECRET,
    },
    body: JSON.stringify(body),
  });
}

describe('webhook end-to-end with stubProcessor', () => {
  beforeEach(() => {
    vi.stubEnv('TELEGRAM_WEBHOOK_SECRET', VALID_SECRET);
    vi.stubEnv('TELEGRAM_ALLOWED_USER_IDS', ALLOWED_USER_ID);
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'bot-e2e:TOKEN');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"ok":true}', { status: 200 }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('a text message round-trips: webhook → MessageLog → reply sent', async () => {
    const update = {
      update_id: 300,
      message: {
        message_id: 42,
        from: { id: Number(ALLOWED_USER_ID), is_bot: false, first_name: 'E2E', username: 'e2euser' },
        chat: { id: Number(ALLOWED_USER_ID), type: 'private', first_name: 'E2E' },
        date: 1700000000,
        text: 'Teste end-to-end',
      },
    };

    const res = await POST(makeRequest(update));
    expect(res.status).toBe(200);

    const log = await prisma.messageLog.findFirst();
    expect(log).not.toBeNull();
    expect(log?.normalizedText).toBe('Teste end-to-end');
    expect(log?.messageType).toBe('text');

    const fetchSpy = vi.mocked(fetch);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('bot-e2e:TOKEN/sendMessage'),
      expect.any(Object),
    );
  });

  it('logs include the userId and messageLogId for traceability', async () => {
    const logSpy = vi.spyOn(
      (await import('../../src/lib/logger')).logger,
      'error',
    );

    const update = {
      update_id: 301,
      message: {
        message_id: 43,
        from: { id: Number(ALLOWED_USER_ID), is_bot: false, first_name: 'E2E' },
        chat: { id: Number(ALLOWED_USER_ID), type: 'private', first_name: 'E2E' },
        date: 1700000000,
        text: 'Outro teste',
      },
    };

    await POST(makeRequest(update));

    const user = await prisma.user.findFirst({ where: { telegramUserId: ALLOWED_USER_ID } });
    const log = await prisma.messageLog.findFirst();

    expect(user).not.toBeNull();
    expect(log).not.toBeNull();
    expect(log?.userId).toBe(user?.id);
    expect(log?.id).toBeTruthy();

    logSpy.mockRestore();
  });
});
