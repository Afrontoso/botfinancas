// @vitest-environment jsdom
/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { DashboardView } from '../../src/components/dashboard-view';

describe('DashboardView', () => {
  it('renders the three balance cards', () => {
    render(
      <DashboardView
        balance={{ income: 3000, expense: 500, net: 2500 }}
        recent={[]}
      />,
    );
    expect(screen.getByText('Receitas')).toBeInTheDocument();
    expect(screen.getByText('Despesas')).toBeInTheDocument();
    expect(screen.getByText('Saldo')).toBeInTheDocument();
    expect(screen.getByText('R$ 3000.00')).toBeInTheDocument();
    expect(screen.getByText('R$ 500.00')).toBeInTheDocument();
    expect(screen.getByText('R$ 2500.00')).toBeInTheDocument();
  });

  it('renders empty state when no transactions', () => {
    render(
      <DashboardView
        balance={{ income: 0, expense: 0, net: 0 }}
        recent={[]}
      />,
    );
    expect(screen.getByText(/nenhuma transação/i)).toBeInTheDocument();
  });

  it('renders recent transactions with category and date', () => {
    render(
      <DashboardView
        balance={{ income: 100, expense: 50, net: 50 }}
        recent={[
          {
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
          },
        ]}
      />,
    );
    expect(screen.getByText('Mercado')).toBeInTheDocument();
    expect(screen.getByText(/Alimentação/)).toBeInTheDocument();
    expect(screen.getByText(/2026-05-10/)).toBeInTheDocument();
  });
});
