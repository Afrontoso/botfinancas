/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '../setup';

vi.mock('../../src/financial/processor', () => ({
  processMessage: vi.fn().mockResolvedValue({
    type: 'query',
    reply: 'Mensagem recebida. Processamento por IA ainda não está ativo.',
  }),
}));

import { POST } from '../../src/app/api/webhooks/telegram/route';
import { processMessage } from '../../src/financial/processor';

const VALID_SECRET = 'test-secret-token-xxxx';
const ALLOWED_USER_ID = '123456789';

function makeTextUpdate(messageId = 1, fromId = ALLOWED_USER_ID, text = 'Olá bot') {
  return {
    update_id: 100 + messageId,
    message: {
      message_id: messageId,
      from: { id: Number(fromId), is_bot: false, first_name: 'Test', username: 'testuser' },
      chat: { id: Number(fromId), type: 'private', first_name: 'Test' },
      date: 1700000000,
      text,
    },
  };
}

function makeRequest(body: unknown, secret: string | null = VALID_SECRET) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (secret !== null) headers['x-telegram-bot-api-secret-token'] = secret;
  return new Request('http://localhost/api/webhooks/telegram', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('POST /api/webhooks/telegram', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubEnv('TELEGRAM_WEBHOOK_SECRET', VALID_SECRET);
    vi.stubEnv('TELEGRAM_ALLOWED_USER_IDS', ALLOWED_USER_ID);
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'bot999:TOKEN');
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"ok":true}', { status: 200 }),
    );
    vi.mocked(processMessage).mockResolvedValue({
      type: 'query',
      reply: 'Mensagem recebida. Processamento por IA ainda não está ativo.',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('returns 401 when x-telegram-bot-api-secret-token is missing', async () => {
    const res = await POST(makeRequest(makeTextUpdate(), null));
    expect(res.status).toBe(401);
  });

  it('returns 401 when secret token is wrong', async () => {
    const res = await POST(makeRequest(makeTextUpdate(), 'wrong-secret'));
    expect(res.status).toBe(401);
  });

  it('returns 200 and persists MessageLog when secret is valid', async () => {
    const res = await POST(makeRequest(makeTextUpdate(1)));
    expect(res.status).toBe(200);
    const log = await prisma.messageLog.findFirst();
    expect(log).not.toBeNull();
  });

  it('creates a User on first message from a new telegramUserId in allowlist', async () => {
    await POST(makeRequest(makeTextUpdate(1)));
    const user = await prisma.user.findFirst({ where: { telegramUserId: ALLOWED_USER_ID } });
    expect(user).not.toBeNull();
  });

  it('does not create User and returns 200 (silently ignored) when sender is not in allowlist', async () => {
    vi.stubEnv('TELEGRAM_ALLOWED_USER_IDS', '99999');
    const res = await POST(makeRequest(makeTextUpdate(1, ALLOWED_USER_ID)));
    expect(res.status).toBe(200);
    const count = await prisma.user.count();
    expect(count).toBe(0);
  });

  it('uses existing User on subsequent messages', async () => {
    await POST(makeRequest(makeTextUpdate(1)));
    await POST(makeRequest(makeTextUpdate(2)));
    const count = await prisma.user.count();
    expect(count).toBe(1);
  });

  it('persists rawPayload as JSON', async () => {
    const update = makeTextUpdate(1);
    await POST(makeRequest(update));
    const log = await prisma.messageLog.findFirst();
    expect(log?.rawPayload).toEqual(update);
  });

  it('persists normalizedText for text messages', async () => {
    await POST(makeRequest(makeTextUpdate(1, ALLOWED_USER_ID, 'Olá mundo')));
    const log = await prisma.messageLog.findFirst();
    expect(log?.normalizedText).toBe('Olá mundo');
  });

  it('persists messageType correctly for each kind of update', async () => {
    await POST(makeRequest(makeTextUpdate(1)));
    const textLog = await prisma.messageLog.findFirst({ where: { telegramMessageId: '1' } });
    expect(textLog?.messageType).toBe('text');

    const voiceUpdate = {
      update_id: 201,
      message: {
        message_id: 2,
        from: { id: Number(ALLOWED_USER_ID), is_bot: false, first_name: 'Test' },
        chat: { id: Number(ALLOWED_USER_ID), type: 'private', first_name: 'Test' },
        date: 1700000000,
        voice: { duration: 5, mime_type: 'audio/ogg', file_id: 'f1', file_unique_id: 'u1' },
      },
    };
    await POST(makeRequest(voiceUpdate));
    const voiceLog = await prisma.messageLog.findFirst({ where: { telegramMessageId: '2' } });
    expect(voiceLog?.messageType).toBe('audio');
  });

  it('calls processMessage with the normalized text and userId', async () => {
    await POST(makeRequest(makeTextUpdate(1, ALLOWED_USER_ID, 'Olá bot')));
    expect(vi.mocked(processMessage)).toHaveBeenCalledOnce();
    const [text, userId] = vi.mocked(processMessage).mock.calls[0]!;
    expect(text).toBe('Olá bot');
    const user = await prisma.user.findFirst({ where: { telegramUserId: ALLOWED_USER_ID } });
    expect(userId).toBe(user?.id);
  });

  it('sends the processMessage reply back via Telegram API (mocked fetch)', async () => {
    vi.mocked(processMessage).mockResolvedValue({
      type: 'query',
      reply: 'Resposta personalizada',
    });
    await POST(makeRequest(makeTextUpdate(1)));
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('bot999:TOKEN/sendMessage'),
      expect.objectContaining({
        body: expect.stringContaining('Resposta personalizada'),
      }),
    );
  });

  it('returns 200 even when processMessage returns rejected (so Telegram does not retry)', async () => {
    vi.mocked(processMessage).mockResolvedValue({
      type: 'rejected',
      reply: 'Ocorreu um erro.',
    });
    const res = await POST(makeRequest(makeTextUpdate(1)));
    expect(res.status).toBe(200);
  });

  it('returns 200 even when processMessage throws (logs the error)', async () => {
    vi.mocked(processMessage).mockRejectedValue(new Error('processor crash'));
    const res = await POST(makeRequest(makeTextUpdate(1)));
    expect(res.status).toBe(200);
  });

  it('is idempotent: same telegramMessageId+chatId twice does not duplicate MessageLog', async () => {
    const update = makeTextUpdate(1);
    await POST(makeRequest(update));
    await POST(makeRequest(update));
    const count = await prisma.messageLog.count();
    expect(count).toBe(1);
  });
});
