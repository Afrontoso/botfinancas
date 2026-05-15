/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { TelegramUpdateSchema } from '../../src/webhook/telegram-payload';

const baseMessage = {
  message_id: 1,
  from: { id: 123456, is_bot: false, first_name: 'Victor' },
  chat: { id: 123456, type: 'private' },
  date: 1715000000,
};

describe('TelegramUpdateSchema', () => {
  it('parses a valid text message update', () => {
    const update = { update_id: 1, message: { ...baseMessage, text: 'Hello' } };
    const result = TelegramUpdateSchema.safeParse(update);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message?.text).toBe('Hello');
    }
  });

  it('parses a valid voice message update', () => {
    const update = {
      update_id: 2,
      message: { ...baseMessage, voice: { file_id: 'abc', duration: 5 } },
    };
    const result = TelegramUpdateSchema.safeParse(update);
    expect(result.success).toBe(true);
  });

  it('rejects update with missing update_id', () => {
    const result = TelegramUpdateSchema.safeParse({ message: baseMessage });
    expect(result.success).toBe(false);
  });

  it('accepts update with message that has no text or media (unknown type)', () => {
    const update = { update_id: 3, message: { ...baseMessage } };
    const result = TelegramUpdateSchema.safeParse(update);
    expect(result.success).toBe(true);
  });

  it('parses photo message update', () => {
    const update = {
      update_id: 4,
      message: {
        ...baseMessage,
        photo: [{ file_id: 'photo1', file_unique_id: 'unique1', width: 320, height: 240, file_size: 10000 }],
      },
    };
    const result = TelegramUpdateSchema.safeParse(update);
    expect(result.success).toBe(true);
  });

  it('parses document message update', () => {
    const update = {
      update_id: 5,
      message: {
        ...baseMessage,
        document: { file_id: 'doc1', file_unique_id: 'unique2', file_name: 'file.pdf' },
      },
    };
    const result = TelegramUpdateSchema.safeParse(update);
    expect(result.success).toBe(true);
  });
});
