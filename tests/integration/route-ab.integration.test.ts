/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '../setup';

import expenseSimple from '../../shared/fixtures/expense_simple.json';
import expenseWithCard from '../../shared/fixtures/expense_with_card.json';

const llmQueue = vi.hoisted(() => [] as string[]);

vi.mock('../../src/ai/llm-client', () => {
  class FakeLlm {
    async complete(_prompt: string): Promise<string> {
      const next = llmQueue.shift();
      if (next === undefined) throw new Error('LLM queue exhausted in test');
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

const VALID_SECRET = 'integration-secret-abcd';
const ALLOWED_USER_ID = '555666777';

function makeRequest(body: unknown, secret: string | null = VALID_SECRET) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (secret !== null) headers['x-telegram-bot-api-secret-token'] = secret;
  return new Request('http://localhost/api/webhooks/telegram', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

function makeUpdate(text: string, messageId = 1) {
  return {
    update_id: 500 + messageId,
    message: {
      message_id: messageId,
      from: { id: Number(ALLOWED_USER_ID), is_bot: false, first_name: 'Integration' },
      chat: { id: Number(ALLOWED_USER_ID), type: 'private', first_name: 'Integration' },
      date: 1700000000,
      text,
    },
  };
}

describe('route A↔B integration (real DB + mocked OllamaLlmClient)', () => {
  beforeEach(() => {
    llmQueue.length = 0;
    vi.stubEnv('TELEGRAM_WEBHOOK_SECRET', VALID_SECRET);
    vi.stubEnv('TELEGRAM_ALLOWED_USER_IDS', ALLOWED_USER_ID);
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'bot-ab:TOKEN');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"ok":true}', { status: 200 }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('returns 401 when secret token is missing', async () => {
    const res = await POST(makeRequest(makeUpdate('qualquer'), null));
    expect(res.status).toBe(401);
  });

  it('simple expense: creates Transaction in DB and calls sendMessage', async () => {
    llmQueue.push(expenseSimple.llmRawResponse);

    const res = await POST(makeRequest(makeUpdate(expenseSimple.input.text, 1)));
    expect(res.status).toBe(200);

    const tx = await prisma.transaction.findFirst({});
    expect(tx).not.toBeNull();
    expect(Number(tx?.amount)).toBe(50);
    expect(tx?.type).toBe('expense');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('bot-ab:TOKEN/sendMessage'),
      expect.any(Object),
    );
  });

  it('card expense: creates Transaction and increments Invoice.totalAmount atomically', async () => {
    const user = await prisma.user.create({
      data: { telegramUserId: ALLOWED_USER_ID, name: 'Integration User' },
    });
    const account = await prisma.financialAccount.create({
      data: { userId: user.id, name: 'Nubank', type: 'credit_card', closingDay: 15, dueDay: 22 },
    });
    const invoice = await prisma.invoice.create({
      data: {
        accountId: account.id,
        periodStart: new Date('2026-05-01'),
        periodEnd: new Date('2026-05-15'),
        dueDate: new Date('2026-05-22'),
        totalAmount: 0,
        status: 'open',
      },
    });

    llmQueue.push(expenseWithCard.llmRawResponse);

    const res = await POST(makeRequest(makeUpdate(expenseWithCard.input.text, 2)));
    expect(res.status).toBe(200);

    const tx = await prisma.transaction.findFirst({ where: { userId: user.id } });
    expect(tx).not.toBeNull();
    expect(tx?.invoiceId).toBe(invoice.id);

    const updated = await prisma.invoice.findUnique({ where: { id: invoice.id } });
    expect(Number(updated?.totalAmount)).toBe(120);
  });
});
