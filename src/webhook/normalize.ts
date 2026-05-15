import type { TelegramUpdate } from './telegram-payload';

export type MessageType = 'text' | 'audio' | 'image' | 'document' | 'unknown';

export interface NormalizedUpdate {
  messageType: MessageType;
  normalizedText: string | null;
  chatId: string;
  telegramMessageId: string;
  rawPayload: TelegramUpdate;
}

export function normalizeTelegramUpdate(update: TelegramUpdate): NormalizedUpdate {
  const message = update.message ?? update.edited_message;

  const chatId = String(message?.chat.id ?? '');
  const telegramMessageId = String(message?.message_id ?? '');

  let messageType: MessageType = 'unknown';
  let normalizedText: string | null = null;

  if (message?.voice) {
    messageType = 'audio';
  } else if (message?.photo) {
    messageType = 'image';
  } else if (message?.document) {
    messageType = 'document';
  } else if (message?.text !== undefined) {
    messageType = 'text';
    normalizedText = message.text.trim();
  }

  return { messageType, normalizedText, chatId, telegramMessageId, rawPayload: update };
}
