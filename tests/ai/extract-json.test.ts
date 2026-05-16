/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { extractJson, ParseError } from '../../src/ai/extract-json';

describe('extractJson', () => {
  it('returns parsed object for clean JSON string', () => {
    const raw = '{"amount": 50, "type": "expense"}';
    const result = extractJson(raw);
    expect(result).toEqual({ amount: 50, type: 'expense' });
  });

  it('extracts JSON when wrapped in markdown code fence ```json ... ```', () => {
    const raw = '```json\n{"amount": 50, "type": "expense"}\n```';
    const result = extractJson(raw);
    expect(result).toEqual({ amount: 50, type: 'expense' });
  });

  it('extracts JSON when wrapped in markdown code fence without language tag', () => {
    const raw = '```\n{"amount": 50, "type": "expense"}\n```';
    const result = extractJson(raw);
    expect(result).toEqual({ amount: 50, type: 'expense' });
  });

  it('extracts JSON when preceded by explanatory text', () => {
    const raw = 'Here is the extracted data:\n{"amount": 50, "type": "expense"}';
    const result = extractJson(raw);
    expect(result).toEqual({ amount: 50, type: 'expense' });
  });

  it('extracts JSON when followed by explanatory text', () => {
    const raw = '{"amount": 50, "type": "expense"}\nThis is the parsed expense.';
    const result = extractJson(raw);
    expect(result).toEqual({ amount: 50, type: 'expense' });
  });

  it('extracts JSON when surrounded by both prefix and suffix', () => {
    const raw = 'Sure! Here:\n{"amount": 50, "type": "expense"}\nHope that helps!';
    const result = extractJson(raw);
    expect(result).toEqual({ amount: 50, type: 'expense' });
  });

  it('returns the first JSON object when multiple are present', () => {
    const raw = '{"first": true} and then {"second": true}';
    const result = extractJson(raw);
    expect(result).toEqual({ first: true });
  });

  it('throws ParseError when no JSON-like substring is found', () => {
    const raw = 'No JSON here at all, just plain text.';
    expect(() => extractJson(raw)).toThrow(ParseError);
  });

  it('throws ParseError when JSON-like substring is malformed (unbalanced braces)', () => {
    const raw = 'Here is broken JSON: {"amount": 50, "type": "expense"';
    expect(() => extractJson(raw)).toThrow(ParseError);
  });

  it('handles nested objects correctly', () => {
    const raw = '{"transaction": {"amount": 100, "category": {"name": "food"}}}';
    const result = extractJson(raw);
    expect(result).toEqual({
      transaction: { amount: 100, category: { name: 'food' } },
    });
  });

  it('handles arrays inside the object', () => {
    const raw = '{"tags": ["food", "lunch"], "amount": 25}';
    const result = extractJson(raw);
    expect(result).toEqual({ tags: ['food', 'lunch'], amount: 25 });
  });
});
