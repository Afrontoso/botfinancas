/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendMessage } from '../../src/webhook/reply';

describe('sendMessage', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'bot123:TOKEN');
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('calls fetch with the correct Telegram API URL', async () => {
    fetchSpy.mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
    await sendMessage('123456', 'Hello');
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('bot123:TOKEN/sendMessage'),
      expect.any(Object),
    );
  });

  it('sends correct JSON body with chat_id and text', async () => {
    fetchSpy.mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
    await sendMessage('123456', 'Hello world');
    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string) as unknown;
    expect(body).toEqual({ chat_id: '123456', text: 'Hello world' });
  });

  it('resolves without error on 200 response', async () => {
    fetchSpy.mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
    await expect(sendMessage('123456', 'Hello')).resolves.toBeUndefined();
  });

  it('throws when response is not ok', async () => {
    fetchSpy.mockResolvedValue(new Response('Bad Request', { status: 400 }));
    await expect(sendMessage('123456', 'Hello')).rejects.toThrow();
  });
});
