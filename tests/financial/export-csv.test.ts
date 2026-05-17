/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { transactionsToCsv } from '../../src/financial/export-csv';
import type { TransactionWithCategory } from '../../src/financial/queries';

function makeTx(overrides: Partial<TransactionWithCategory> = {}): TransactionWithCategory {
  return {
    id: 'tx1',
    userId: 'u1',
    accountId: null,
    categoryId: 'c1',
    invoiceId: null,
    type: 'expense',
    direction: null,
    amount: 50 as never,
    currency: 'BRL',
    description: 'Mercado',
    transactionDate: new Date('2026-05-10T00:00:00Z'),
    paymentMethod: null,
    installmentNumber: null,
    installmentTotal: null,
    source: 'telegram_text',
    confidence: 0.9,
    status: 'confirmed',
    transferGroupId: null,
    createdAt: new Date('2026-05-10T00:00:00Z'),
    updatedAt: new Date('2026-05-10T00:00:00Z'),
    category: {
      id: 'c1',
      userId: 'u1',
      name: 'Alimentação',
      type: 'expense',
      parentId: null,
      createdAt: new Date('2026-05-10T00:00:00Z'),
    },
    ...overrides,
  };
}

describe('transactionsToCsv', () => {
  it('returns header only when given empty array', () => {
    const csv = transactionsToCsv([]);
    expect(csv).toBe('date,type,description,category,amount,currency\n');
  });

  it('emits one row per transaction with yyyy-mm-dd date', () => {
    const csv = transactionsToCsv([makeTx()]);
    const lines = csv.trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe('2026-05-10,expense,Mercado,Alimentação,50.00,BRL');
  });

  it('uses "Sem categoria" when category is null', () => {
    const csv = transactionsToCsv([makeTx({ categoryId: null, category: null })]);
    expect(csv).toContain(',Sem categoria,');
  });

  it('escapes descriptions containing commas with double quotes', () => {
    const csv = transactionsToCsv([makeTx({ description: 'Mercado, padaria' })]);
    expect(csv).toContain(',"Mercado, padaria",');
  });

  it('escapes descriptions containing double quotes by doubling them', () => {
    const csv = transactionsToCsv([makeTx({ description: 'Café "do bairro"' })]);
    expect(csv).toContain(',"Café ""do bairro""",');
  });

  it('escapes descriptions containing newlines', () => {
    const csv = transactionsToCsv([makeTx({ description: 'linha1\nlinha2' })]);
    expect(csv).toContain('"linha1\nlinha2"');
  });

  it('formats Decimal amounts with two decimal places', () => {
    const csv = transactionsToCsv([makeTx({ amount: 1234.5 as never })]);
    expect(csv).toContain(',1234.50,');
  });

  it('preserves currency field', () => {
    const csv = transactionsToCsv([makeTx({ currency: 'USD' })]);
    expect(csv).toMatch(/,USD$/m);
  });
});
