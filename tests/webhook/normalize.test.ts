/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { normalizeTelegramUpdate } from '../../src/webhook/normalize';
import type { TelegramUpdate } from '../../src/webhook/telegram-payload';

const baseMessage = {
  message_id: 42,
  from: { id: 123456, is_bot: false, first_name: 'Victor' },
  chat: { id: 123456, type: 'private' as const },
  date: 1715000000,
};

describe('normalizeTelegramUpdate', () => {
  it('extracts text message into messageType=text and normalizedText', () => {
    const update: TelegramUpdate = { update_id: 1, message: { ...baseMessage, text: 'Hello' } };
    const result = normalizeTelegramUpdate(update);
    expect(result.messageType).toBe('text');
    expect(result.normalizedText).toBe('Hello');
  });

  it('detects voice message and sets messageType=audio', () => {
    const update: TelegramUpdate = {
      update_id: 2,
      message: { ...baseMessage, voice: { file_id: 'abc', duration: 5 } },
    };
    const result = normalizeTelegramUpdate(update);
    expect(result.messageType).toBe('audio');
  });

  it('detects photo and sets messageType=image', () => {
    const update: TelegramUpdate = {
      update_id: 3,
      message: {
        ...baseMessage,
        photo: [{ file_id: 'p1', file_unique_id: 'u1', width: 320, height: 240 }],
      },
    };
    const result = normalizeTelegramUpdate(update);
    expect(result.messageType).toBe('image');
  });

  it('detects document and sets messageType=document', () => {
    const update: TelegramUpdate = {
      update_id: 4,
      message: { ...baseMessage, document: { file_id: 'd1', file_unique_id: 'u2' } },
    };
    const result = normalizeTelegramUpdate(update);
    expect(result.messageType).toBe('document');
  });

  it('returns messageType=unknown for unsupported types', () => {
    const update: TelegramUpdate = { update_id: 5, message: { ...baseMessage } };
    const result = normalizeTelegramUpdate(update);
    expect(result.messageType).toBe('unknown');
  });

  it('extracts chatId and telegramMessageId as strings', () => {
    const update: TelegramUpdate = { update_id: 6, message: { ...baseMessage, text: 'Hi' } };
    const result = normalizeTelegramUpdate(update);
    expect(result.chatId).toBe('123456');
    expect(result.telegramMessageId).toBe('42');
  });

  it('trims whitespace from text', () => {
    const update: TelegramUpdate = {
      update_id: 7,
      message: { ...baseMessage, text: '  hello world  ' },
    };
    const result = normalizeTelegramUpdate(update);
    expect(result.normalizedText).toBe('hello world');
  });

  it('preserves the raw payload untouched in result.rawPayload', () => {
    const update: TelegramUpdate = { update_id: 8, message: { ...baseMessage, text: 'test' } };
    const result = normalizeTelegramUpdate(update);
    expect(result.rawPayload).toEqual(update);
  });
});
