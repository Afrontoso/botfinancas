// @vitest-environment jsdom
/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { InvoicesView, type InvoiceWithAccount } from '../../src/components/invoices-view';

function makeInvoice(overrides: Partial<InvoiceWithAccount> = {}): InvoiceWithAccount {
  return {
    id: 'inv1',
    accountId: 'acc1',
    periodStart: new Date('2026-04-15T00:00:00Z'),
    periodEnd: new Date('2026-05-14T00:00:00Z'),
    dueDate: new Date('2026-05-20T00:00:00Z'),
    totalAmount: 1500 as never,
    paidAmount: 0 as never,
    status: 'open',
    createdAt: new Date('2026-04-15T00:00:00Z'),
    updatedAt: new Date('2026-04-15T00:00:00Z'),
    account: { id: 'acc1', name: 'Nubank' },
    ...overrides,
  };
}

describe('InvoicesView', () => {
  it('renders empty state when no invoices', () => {
    render(<InvoicesView invoices={[]} />);
    expect(screen.getByText(/Nenhuma fatura registrada/i)).toBeInTheDocument();
  });

  it('renders invoice with account, dates and totals', () => {
    render(<InvoicesView invoices={[makeInvoice()]} />);
    expect(screen.getByText('Nubank')).toBeInTheDocument();
    expect(screen.getByText(/2026-04-15.+2026-05-14/)).toBeInTheDocument();
    expect(screen.getByText(/vence em 2026-05-20/)).toBeInTheDocument();
    expect(screen.getByText('R$ 1500.00')).toBeInTheDocument();
    expect(screen.getByText(/pago R\$ 0\.00 · resta R\$ 1500\.00/)).toBeInTheDocument();
  });

  it('shows badge with translated status', () => {
    render(
      <InvoicesView
        invoices={[
          makeInvoice({ id: 'a', status: 'open' }),
          makeInvoice({ id: 'b', status: 'partial', paidAmount: 500 as never }),
          makeInvoice({ id: 'c', status: 'paid', paidAmount: 1500 as never }),
        ]}
      />,
    );
    expect(screen.getByText('Aberta')).toBeInTheDocument();
    expect(screen.getByText('Parcial')).toBeInTheDocument();
    expect(screen.getByText('Paga')).toBeInTheDocument();
  });
});
