// @vitest-environment jsdom
/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { TransactionsView } from '../../src/components/transactions-view';
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

describe('TransactionsView', () => {
  it('renders empty state when no transactions match', () => {
    render(
      <TransactionsView
        items={[]}
        total={0}
        page={1}
        pageSize={20}
        filter={{}}
        categories={[]}
      />,
    );
    expect(screen.getByText(/Nenhuma transação encontrada/i)).toBeInTheDocument();
    expect(screen.getByText(/0 registros/)).toBeInTheDocument();
  });

  it('renders items with description, date and amount', () => {
    render(
      <TransactionsView
        items={[makeTx()]}
        total={1}
        page={1}
        pageSize={20}
        filter={{}}
        categories={[{ id: 'c1', name: 'Alimentação' }]}
      />,
    );
    expect(screen.getByText('Mercado')).toBeInTheDocument();
    expect(screen.getByText(/2026-05-10/)).toBeInTheDocument();
    expect(screen.getByText(/-R\$ 50\.00/)).toBeInTheDocument();
  });

  it('disables previous link on page 1 and enables next when more pages exist', () => {
    render(
      <TransactionsView
        items={[makeTx()]}
        total={50}
        page={1}
        pageSize={20}
        filter={{}}
        categories={[]}
      />,
    );
    expect(screen.getByText('← Anterior').tagName).toBe('SPAN');
    const next = screen.getByText('Próxima →');
    expect(next.tagName).toBe('A');
    expect(next).toHaveAttribute('href', '/transactions?page=2');
  });

  it('preserves filters in pagination links', () => {
    render(
      <TransactionsView
        items={[makeTx()]}
        total={50}
        page={2}
        pageSize={20}
        filter={{ type: 'expense', categoryId: 'c1' }}
        categories={[{ id: 'c1', name: 'Alimentação' }]}
      />,
    );
    const prev = screen.getByText('← Anterior');
    expect(prev).toHaveAttribute('href', '/transactions?page=1&type=expense&categoryId=c1');
    const next = screen.getByText('Próxima →');
    expect(next).toHaveAttribute('href', '/transactions?page=3&type=expense&categoryId=c1');
  });

  it('renders category options in filter dropdown', () => {
    render(
      <TransactionsView
        items={[]}
        total={0}
        page={1}
        pageSize={20}
        filter={{}}
        categories={[
          { id: 'c1', name: 'Alimentação' },
          { id: 'c2', name: 'Transporte' },
        ]}
      />,
    );
    expect(screen.getByRole('option', { name: 'Alimentação' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Transporte' })).toBeInTheDocument();
  });
});
