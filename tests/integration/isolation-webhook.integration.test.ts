/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '../setup';

const llmQueue = vi.hoisted(() => [] as string[]);

vi.mock('../../src/ai/llm-client', () => {
  class FakeLlm {
    async complete(_prompt: string): Promise<string> {
      const next = llmQueue.shift();
      if (next === undefined) throw new Error('LLM queue exhausted');
      return next;
    }
  }
  return {
    OllamaLlmClient: FakeLlm,
    GeminiLlmClient: FakeLlm,
    makeLlmClient: () => new FakeLlm(),
  };
});

import { POST } from '../../src/app/api/webhooks/telegram/route';

const SECRET = 'multi-user-secret';
const USER_A_ID = '111111111';
const USER_B_ID = '222222222';

function makeReq(body: unknown) {
  return new Request('http://localhost/api/webhooks/telegram', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-telegram-bot-api-secret-token': SECRET,
    },
    body: JSON.stringify(body),
  });
}

function makeUpdate(fromId: string, text: string, messageId: number) {
  return {
    update_id: 900 + messageId,
    message: {
      message_id: messageId,
      from: { id: Number(fromId), is_bot: false, first_name: 'User' },
      chat: { id: Number(fromId), type: 'private', first_name: 'User' },
      date: 1700000000,
      text,
    },
  };
}

const EXPENSE_A = JSON.stringify({
  intent: 'create_transaction',
  type: 'expense',
  amount: 100,
  currency: 'BRL',
  description: 'A bought',
  category: 'CategoryA',
  transactionDate: '2026-05-01',
  paymentMethod: null,
  confidence: 0.9,
});

const EXPENSE_B = JSON.stringify({
  intent: 'create_transaction',
  type: 'expense',
  amount: 999,
  currency: 'BRL',
  description: 'B bought',
  category: 'CategoryB',
  transactionDate: '2026-05-01',
  paymentMethod: null,
  confidence: 0.9,
});

describe('multi-user webhook isolation', () => {
  beforeEach(() => {
    llmQueue.length = 0;
    vi.stubEnv('TELEGRAM_WEBHOOK_SECRET', SECRET);
    vi.stubEnv('TELEGRAM_ALLOWED_USER_IDS', `${USER_A_ID},${USER_B_ID}`);
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'bot:TOKEN');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"ok":true}', { status: 200 }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('two distinct telegramUserIds keep their data separate', async () => {
    llmQueue.push(EXPENSE_A);
    llmQueue.push(EXPENSE_B);

    await POST(makeReq(makeUpdate(USER_A_ID, 'gastei 100', 1)));
    await POST(makeReq(makeUpdate(USER_B_ID, 'gastei 999', 2)));

    const a = await prisma.user.findUnique({ where: { telegramUserId: USER_A_ID } });
    const b = await prisma.user.findUnique({ where: { telegramUserId: USER_B_ID } });
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a?.id).not.toBe(b?.id);

    const txA = await prisma.transaction.findMany({ where: { userId: a!.id } });
    const txB = await prisma.transaction.findMany({ where: { userId: b!.id } });
    expect(txA).toHaveLength(1);
    expect(txB).toHaveLength(1);
    expect(Number(txA[0]?.amount)).toBe(100);
    expect(Number(txB[0]?.amount)).toBe(999);

    const catA = await prisma.category.findMany({ where: { userId: a!.id } });
    const catB = await prisma.category.findMany({ where: { userId: b!.id } });
    expect(catA).toHaveLength(1);
    expect(catB).toHaveLength(1);
    expect(catA[0]?.name.toLowerCase()).toBe('categorya');
    expect(catB[0]?.name.toLowerCase()).toBe('categoryb');
  });

  it('user not in allowlist is silently ignored (no data created)', async () => {
    const beforeCount = await prisma.user.count();
    await POST(makeReq(makeUpdate('999999999', 'gastei 100', 3)));
    const afterCount = await prisma.user.count();
    expect(afterCount).toBe(beforeCount);
  });
});
