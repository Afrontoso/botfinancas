/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { FakeLlmClient } from '../../src/ai/fake-llm-client';
import expenseSimple from '../../shared/fixtures/expense_simple.json';

describe('FakeLlmClient', () => {
  it('returns responses in FIFO order', async () => {
    const client = new FakeLlmClient([
      expenseSimple.llmRawResponse,
      'segunda resposta',
    ]);
    expect(await client.complete('prompt 1')).toBe(expenseSimple.llmRawResponse);
    expect(await client.complete('prompt 2')).toBe('segunda resposta');
  });

  it('throws when queue is exhausted', async () => {
    const client = new FakeLlmClient([]);
    await expect(client.complete('qualquer')).rejects.toThrow(
      'FakeLlmClient: fila de respostas esgotada',
    );
  });
});
