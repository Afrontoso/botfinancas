/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { transactionsToPdf } from '../../src/financial/export-pdf';
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

describe('transactionsToPdf', () => {
  it('returns a Buffer that starts with the PDF magic bytes', async () => {
    const buf = await transactionsToPdf([makeTx()]);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.slice(0, 4).toString('ascii')).toBe('%PDF');
  });

  it('produces a non-trivial PDF even with an empty transaction list', async () => {
    const buf = await transactionsToPdf([]);
    expect(buf.length).toBeGreaterThan(200);
    expect(buf.slice(0, 4).toString('ascii')).toBe('%PDF');
  });

  it('produces larger output with more transactions', async () => {
    const one = await transactionsToPdf([makeTx()]);
    const many = await transactionsToPdf(
      Array.from({ length: 20 }, (_, i) =>
        makeTx({ id: `tx${i}`, description: `Compra ${i}`, amount: (i + 1) as never }),
      ),
    );
    expect(many.length).toBeGreaterThan(one.length);
  });
});
