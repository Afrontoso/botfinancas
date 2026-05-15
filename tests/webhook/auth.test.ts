/// <reference types="vitest/globals" />
import { describe, it, expect, afterEach } from 'vitest';
import { validateTelegramSecret, isUserAllowed } from '../../src/webhook/auth';

describe('validateTelegramSecret', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns ok when secret header matches env value', () => {
    vi.stubEnv('TELEGRAM_WEBHOOK_SECRET', 'mysecret');
    const req = new Request('http://localhost', {
      headers: { 'x-telegram-bot-api-secret-token': 'mysecret' },
    });
    expect(validateTelegramSecret(req)).toEqual({ ok: true });
  });

  it('returns 401 when secret header is missing', () => {
    vi.stubEnv('TELEGRAM_WEBHOOK_SECRET', 'mysecret');
    const req = new Request('http://localhost');
    expect(validateTelegramSecret(req)).toEqual({ ok: false, status: 401 });
  });

  it('returns 401 when secret header is wrong', () => {
    vi.stubEnv('TELEGRAM_WEBHOOK_SECRET', 'mysecret');
    const req = new Request('http://localhost', {
      headers: { 'x-telegram-bot-api-secret-token': 'wrongsecret' },
    });
    expect(validateTelegramSecret(req)).toEqual({ ok: false, status: 401 });
  });

  it('returns 401 when env secret is empty (fail closed)', () => {
    vi.stubEnv('TELEGRAM_WEBHOOK_SECRET', '');
    const req = new Request('http://localhost', {
      headers: { 'x-telegram-bot-api-secret-token': '' },
    });
    expect(validateTelegramSecret(req)).toEqual({ ok: false, status: 401 });
  });
});

describe('isUserAllowed', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns true when telegramUserId is in allowlist', () => {
    vi.stubEnv('TELEGRAM_ALLOWED_USER_IDS', '123456,789012');
    expect(isUserAllowed('123456')).toBe(true);
  });

  it('returns false when telegramUserId is not in allowlist', () => {
    vi.stubEnv('TELEGRAM_ALLOWED_USER_IDS', '123456,789012');
    expect(isUserAllowed('999999')).toBe(false);
  });

  it('returns false when allowlist is empty (fail closed)', () => {
    vi.stubEnv('TELEGRAM_ALLOWED_USER_IDS', '');
    expect(isUserAllowed('123456')).toBe(false);
  });

  it('parses allowlist from comma-separated env var', () => {
    vi.stubEnv('TELEGRAM_ALLOWED_USER_IDS', ' 123 , 456 ');
    expect(isUserAllowed('123')).toBe(true);
    expect(isUserAllowed('456')).toBe(true);
    expect(isUserAllowed('789')).toBe(false);
  });
});
