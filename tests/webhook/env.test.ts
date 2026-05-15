/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseEnv } from '../../src/lib/env';

const VALID_ENV = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  TEST_DATABASE_URL: 'postgresql://user:pass@localhost:5432/db_test',
  TELEGRAM_BOT_TOKEN: 'abc123:TOKEN',
  TELEGRAM_WEBHOOK_SECRET: 'supersecret',
  TELEGRAM_ALLOWED_USER_IDS: '123456,789012',
  OLLAMA_BASE_URL: 'http://localhost:11434',
  OLLAMA_TEXT_MODEL: 'llama3.1',
  LOG_LEVEL: 'info',
  NODE_ENV: 'test',
};

describe('parseEnv', () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = { ...process.env };
    Object.keys(process.env).forEach((k) => delete process.env[k]);
  });

  afterEach(() => {
    Object.keys(process.env).forEach((k) => delete process.env[k]);
    Object.assign(process.env, saved);
  });

  it('returns typed config object when all required vars are present', () => {
    Object.assign(process.env, VALID_ENV);
    const config = parseEnv();
    expect(config.databaseUrl).toBe(VALID_ENV.DATABASE_URL);
    expect(config.telegramBotToken).toBe(VALID_ENV.TELEGRAM_BOT_TOKEN);
    expect(config.ollamaBaseUrl).toBe(VALID_ENV.OLLAMA_BASE_URL);
  });

  it('throws when DATABASE_URL is missing', () => {
    Object.assign(process.env, VALID_ENV);
    delete process.env['DATABASE_URL'];
    expect(() => parseEnv()).toThrow();
  });

  it('throws when TELEGRAM_BOT_TOKEN is missing', () => {
    Object.assign(process.env, VALID_ENV);
    delete process.env['TELEGRAM_BOT_TOKEN'];
    expect(() => parseEnv()).toThrow();
  });

  it('throws when TELEGRAM_WEBHOOK_SECRET is missing', () => {
    Object.assign(process.env, VALID_ENV);
    delete process.env['TELEGRAM_WEBHOOK_SECRET'];
    expect(() => parseEnv()).toThrow();
  });

  it('uses defaults for optional vars (LOG_LEVEL, NODE_ENV)', () => {
    Object.assign(process.env, VALID_ENV);
    delete process.env['LOG_LEVEL'];
    delete process.env['NODE_ENV'];
    const config = parseEnv();
    expect(config.logLevel).toBe('info');
    expect(config.nodeEnv).toBe('development');
  });
});
