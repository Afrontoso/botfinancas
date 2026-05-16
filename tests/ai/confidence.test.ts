/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { calculateConfidence } from '../../src/ai/confidence';
import type { LlmTransaction } from '../../src/ai/schemas';

const ALL_FIELDS: Partial<LlmTransaction> = {
  intent: 'create_transaction',
  type: 'expense',
  amount: 50.0,
  currency: 'BRL',
  description: 'Almoço no restaurante',
  category: 'Alimentação',
  transactionDate: '2024-05-10',
  paymentMethod: null,
  confidence: 0.95,
};

describe('calculateConfidence', () => {
  it('returns 1.0 when all fields are present', () => {
    expect(calculateConfidence(ALL_FIELDS)).toBe(1.0);
  });

  it('returns 0.8 when category is absent', () => {
    const { category: _category, ...withoutCategory } = ALL_FIELDS;
    expect(calculateConfidence(withoutCategory)).toBe(0.8);
  });

  it('returns 0.65 when both category and transactionDate are absent', () => {
    const { category: _category, transactionDate: _date, ...withoutBoth } = ALL_FIELDS;
    expect(calculateConfidence(withoutBoth)).toBeCloseTo(0.65, 5);
  });

  it('returns 0.65 when only type and amount are present', () => {
    const partial: Partial<LlmTransaction> = { type: 'expense', amount: 100 };
    expect(calculateConfidence(partial)).toBeCloseTo(0.65, 5);
  });

  it('returns near 0 when no relevant fields are present', () => {
    expect(calculateConfidence({})).toBeCloseTo(0.05, 5);
  });
});
