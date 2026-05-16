/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { LlmTransactionSchema, LlmQuerySchema, LlmOutputSchema } from '../../src/ai/schemas';

const VALID_TRANSACTION = {
  intent: 'create_transaction' as const,
  type: 'expense' as const,
  amount: 50.0,
  currency: 'BRL',
  description: 'Almoço no restaurante',
  transactionDate: '2024-05-10',
  confidence: 0.95,
};

const VALID_QUERY = {
  intent: 'query' as const,
  queryType: 'balance' as const,
  confidence: 0.9,
};

describe('LlmTransactionSchema', () => {
  it('validates a complete expense object', () => {
    const result = LlmTransactionSchema.safeParse(VALID_TRANSACTION);
    expect(result.success).toBe(true);
  });

  it('validates an income object', () => {
    const result = LlmTransactionSchema.safeParse({
      ...VALID_TRANSACTION,
      type: 'income',
      description: 'Salário',
      amount: 3000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects amount <= 0', () => {
    const result = LlmTransactionSchema.safeParse({
      ...VALID_TRANSACTION,
      amount: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown type values', () => {
    const result = LlmTransactionSchema.safeParse({
      ...VALID_TRANSACTION,
      type: 'unknown_type',
    });
    expect(result.success).toBe(false);
  });

  it('rejects malformed date (DD/MM/YYYY)', () => {
    const result = LlmTransactionSchema.safeParse({
      ...VALID_TRANSACTION,
      transactionDate: '10/05/2024',
    });
    expect(result.success).toBe(false);
  });

  it('rejects confidence > 1', () => {
    const result = LlmTransactionSchema.safeParse({
      ...VALID_TRANSACTION,
      confidence: 1.1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects confidence < 0', () => {
    const result = LlmTransactionSchema.safeParse({
      ...VALID_TRANSACTION,
      confidence: -0.1,
    });
    expect(result.success).toBe(false);
  });

  it('defaults currency to BRL when omitted', () => {
    const { currency: _currency, ...withoutCurrency } = VALID_TRANSACTION;
    const result = LlmTransactionSchema.safeParse(withoutCurrency);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('BRL');
    }
  });

  it('accepts paymentMethod as null', () => {
    const result = LlmTransactionSchema.safeParse({
      ...VALID_TRANSACTION,
      paymentMethod: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts paymentMethod omitted', () => {
    const { ...withoutPayment } = VALID_TRANSACTION;
    const result = LlmTransactionSchema.safeParse(withoutPayment);
    expect(result.success).toBe(true);
  });

  it('rejects empty description', () => {
    const result = LlmTransactionSchema.safeParse({
      ...VALID_TRANSACTION,
      description: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('LlmQuerySchema', () => {
  it('validates a balance query', () => {
    const result = LlmQuerySchema.safeParse(VALID_QUERY);
    expect(result.success).toBe(true);
  });

  it('validates a query with period', () => {
    const result = LlmQuerySchema.safeParse({
      ...VALID_QUERY,
      queryType: 'expense_by_category',
      period: {
        from: '2024-05-01',
        to: '2024-05-31',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown queryType', () => {
    const result = LlmQuerySchema.safeParse({
      ...VALID_QUERY,
      queryType: 'invalid_type',
    });
    expect(result.success).toBe(false);
  });
});

describe('LlmOutputSchema (discriminated union)', () => {
  it('routes to transaction schema when intent=create_transaction', () => {
    const result = LlmOutputSchema.safeParse(VALID_TRANSACTION);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.intent).toBe('create_transaction');
    }
  });

  it('routes to query schema when intent=query', () => {
    const result = LlmOutputSchema.safeParse(VALID_QUERY);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.intent).toBe('query');
    }
  });

  it('rejects unknown intent', () => {
    const result = LlmOutputSchema.safeParse({
      intent: 'delete',
      confidence: 0.8,
    });
    expect(result.success).toBe(false);
  });
});
