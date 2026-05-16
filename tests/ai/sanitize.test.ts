/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { sanitize } from '../../src/ai/sanitize';

describe('sanitize', () => {
  it('converts amount from string "150.00" to number 150', () => {
    const result = sanitize({ amount: '150.00' });
    expect(result.amount).toBe(150);
  });

  it('converts Brazilian comma-decimal "1.500,50" to number 1500.50', () => {
    const result = sanitize({ amount: '1.500,50' });
    expect(result.amount).toBe(1500.5);
  });

  it('trims extra whitespace from description', () => {
    const result = sanitize({ description: '  compra  ' });
    expect(result.description).toBe('compra');
  });

  it('normalizes date from dd/mm/yyyy to yyyy-mm-dd', () => {
    const result = sanitize({ transactionDate: '25/12/2024' });
    expect(result.transactionDate).toBe('2024-12-25');
  });

  it('leaves date unchanged when already in ISO format yyyy-mm-dd', () => {
    const result = sanitize({ transactionDate: '2024-12-25' });
    expect(result.transactionDate).toBe('2024-12-25');
  });

  it('returns unchanged fields when they are already correct', () => {
    const input = {
      amount: 99.9,
      transactionDate: '2024-05-10',
      description: 'mercado',
    };
    const result = sanitize({ ...input });
    expect(result).toEqual(input);
  });
});
