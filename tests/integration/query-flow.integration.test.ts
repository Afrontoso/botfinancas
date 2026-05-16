/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '../setup';

const llmQueue = vi.hoisted(() => [] as string[]);

vi.mock('../../src/ai/llm-client', () => ({
  OllamaLlmClient: class {
    async complete(_prompt: string): Promise<string> {
      const next = llmQueue.shift();
      if (next === undefined) throw new Error('LLM queue exhausted in test');
      return next;
    }
  },
}));

import { POST } from '../../src/app/api/webhooks/telegram/route';

const VALID_SECRET = 'query-flow-secret-xyz';
const ALLOWED_USER_ID = '111222333';

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

function makeUpdate(text: string, messageId = 1) {
  return {
    update_id: 700 + messageId,
    message: {
      message_id: messageId,
      from: { id: Number(ALLOWED_USER_ID), is_bot: false, first_name: 'Query Flow' },
      chat: { id: Number(ALLOWED_USER_ID), type: 'private', first_name: 'Query Flow' },
      date: 1700000000,
      text,
    },
  };
}

describe('end-to-end query flow', () => {
  beforeEach(async () => {
    llmQueue.length = 0;
    vi.stubEnv('TELEGRAM_WEBHOOK_SECRET', VALID_SECRET);
    vi.stubEnv('TELEGRAM_ALLOWED_USER_IDS', ALLOWED_USER_ID);
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'bot-qf:TOKEN');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"ok":true}', { status: 200 }),
    );

    const user = await prisma.user.create({
      data: { telegramUserId: ALLOWED_USER_ID, name: 'Query User' },
    });
    const cat = await prisma.category.create({
      data: { userId: user.id, name: 'Mercado', type: 'expense' },
    });
    await prisma.transaction.createMany({
      data: [
        {
          userId: user.id,
          categoryId: cat.id,
          type: 'expense',
          amount: 50,
          currency: 'BRL',
          description: 'Mercado',
          transactionDate: new Date('2026-05-01'),
        },
        {
          userId: user.id,
          type: 'income',
          amount: 3000,
          currency: 'BRL',
          description: 'Salário',
          transactionDate: new Date('2026-05-05'),
        },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('balance query: webhook → LLM → DB query → reply with totals', async () => {
    llmQueue.push(
      JSON.stringify({
        intent: 'query',
        queryType: 'balance',
        period: { from: '2026-05-01', to: '2026-05-31' },
        confidence: 0.95,
      }),
    );

    const res = await POST(makeRequest(makeUpdate('quanto gastei esse mês?')));
    expect(res.status).toBe(200);

    const sendCalls = vi.mocked(fetch).mock.calls.filter((c) =>
      String(c[0]).includes('bot-qf:TOKEN/sendMessage'),
    );
    expect(sendCalls.length).toBeGreaterThan(0);
    const body = String(sendCalls[0]?.[1]?.body ?? '');
    expect(body).toContain('Receitas');
    expect(body).toContain('3000');
    expect(body).toContain('50');
  });
});
