import type { ReactElement } from 'react';
import type { TransactionWithCategory, BalanceResult } from '../financial/queries';

export type DashboardViewProps = {
  balance: BalanceResult;
  recent: TransactionWithCategory[];
};

export function DashboardView({ balance, recent }: DashboardViewProps): ReactElement {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-sm text-[var(--muted)]">Visão geral das finanças do mês.</p>
      </header>

      <section className="grid grid-cols-3 gap-4">
        <Card label="Receitas" value={balance.income} color="positive" />
        <Card label="Despesas" value={balance.expense} color="negative" />
        <Card label="Saldo" value={balance.net} color={balance.net >= 0 ? 'positive' : 'negative'} />
      </section>

      <section>
        <h3 className="mb-3 text-lg font-medium">Últimas transações</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhuma transação registrada ainda.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <div className="font-medium">{t.description}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {t.transactionDate.toISOString().slice(0, 10)} ·{' '}
                    {t.category?.name ?? 'Sem categoria'}
                  </div>
                </div>
                <div
                  className={
                    t.type === 'expense' ? 'text-[var(--negative)]' : 'text-[var(--positive)]'
                  }
                >
                  {t.type === 'expense' ? '-' : '+'}R$ {Number(t.amount).toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Card({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'positive' | 'negative' | 'neutral';
}): ReactElement {
  const colorClass =
    color === 'positive'
      ? 'text-[var(--positive)]'
      : color === 'negative'
      ? 'text-[var(--negative)]'
      : 'text-[var(--foreground)]';
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[#0a0c10] p-4">
      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${colorClass}`}>R$ {value.toFixed(2)}</div>
    </div>
  );
}
