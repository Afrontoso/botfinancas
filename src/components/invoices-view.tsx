import type { ReactElement } from 'react';
import type { Invoice, Account, InvoiceStatus } from '@prisma/client';
import { PageHeader } from './ui/page-header';
import { formatBRL } from './ui/format';

export type InvoiceWithAccount = Invoice & { account: Pick<Account, 'id' | 'name'> };

export type InvoicesViewProps = {
  invoices: InvoiceWithAccount[];
};

export function InvoicesView({ invoices }: InvoicesViewProps): ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Faturas"
        subtitle={`${invoices.length} fatura${invoices.length === 1 ? '' : 's'} no histórico`}
      />

      {invoices.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Nenhuma fatura registrada.</p>
      ) : (
        <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
          {invoices.map((inv) => {
            const total = Number(inv.totalAmount);
            const paid = Number(inv.paidAmount);
            const remaining = total - paid;
            return (
              <li
                key={inv.id}
                className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-medium">{inv.account.name}</div>
                  <div className="text-xs text-[var(--muted)]">
                    Período {inv.periodStart.toISOString().slice(0, 10)} →{' '}
                    {inv.periodEnd.toISOString().slice(0, 10)} · vence em{' '}
                    {inv.dueDate.toISOString().slice(0, 10)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div>{formatBRL(total)}</div>
                    <div className="text-xs text-[var(--muted)]">
                      pago {formatBRL(paid)} · resta {formatBRL(remaining)}
                    </div>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  open: 'Aberta',
  closed: 'Fechada',
  partial: 'Parcial',
  paid: 'Paga',
};

const STATUS_CLASS: Record<InvoiceStatus, string> = {
  open: 'border-[var(--border)] text-[var(--muted)]',
  closed: 'border-[var(--border)] text-[var(--foreground)]',
  partial: 'border-yellow-700 text-yellow-400',
  paid: 'border-green-800 text-[var(--positive)]',
};

function StatusBadge({ status }: { status: InvoiceStatus }): ReactElement {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
