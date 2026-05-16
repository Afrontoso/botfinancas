/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { parseAiResponse, AiParseError } from '../../src/ai/service';
import expenseSimple from '../../shared/fixtures/expense_simple.json';

describe('parseAiResponse', () => {
  it('returns LlmTransaction when rawText contains valid JSON', async () => {
    const result = await parseAiResponse(expenseSimple.llmRawResponse);
    expect(result.intent).toBe('create_transaction');
    expect(result.type).toBe('expense');
    expect(result.amount).toBe(50);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('throws AiParseError when rawText has no JSON', async () => {
    await expect(parseAiResponse('sem json nenhum')).rejects.toThrow(AiParseError);
  });

  it('throws AiParseError when JSON fields fail schema validation', async () => {
    const invalid = JSON.stringify({ intent: 'create_transaction', amount: -999 });
    await expect(parseAiResponse(invalid)).rejects.toThrow(AiParseError);
  });
});
