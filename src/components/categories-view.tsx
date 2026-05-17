import type { ReactElement } from 'react';
import type { CategoryBreakdown } from '../financial/queries';
import { PageHeader } from './ui/page-header';
import { formatBRL } from './ui/format';

export type CategoriesViewProps = {
  periodLabel: string;
  expenses: CategoryBreakdown[];
  income: CategoryBreakdown[];
};

export function CategoriesView({ periodLabel, expenses, income }: CategoriesViewProps): ReactElement {
  return (
    <div className="space-y-8">
      <PageHeader title="Categorias" subtitle={periodLabel} />

      <Breakdown title="Despesas" rows={expenses} tone="negative" />
      <Breakdown title="Receitas" rows={income} tone="positive" />
    </div>
  );
}

function Breakdown({
  title,
  rows,
  tone,
}: {
  title: string;
  rows: CategoryBreakdown[];
  tone: 'positive' | 'negative';
}): ReactElement {
  const total = rows.reduce((sum, r) => sum + r.total, 0);
  const sorted = [...rows].sort((a, b) => b.total - a.total);
  const toneClass = tone === 'negative' ? 'text-[var(--negative)]' : 'text-[var(--positive)]';

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-lg font-medium">{title}</h3>
        <span className={`text-sm ${toneClass}`}>Total: {formatBRL(total)}</span>
      </div>
      {sorted.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Sem registros no período.</p>
      ) : (
        <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
          {sorted.map((r) => {
            const pct = total > 0 ? (r.total / total) * 100 : 0;
            return (
              <li
                key={r.categoryName}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <div>
                  <div className="font-medium">{r.categoryName}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {r.count} transaç{r.count === 1 ? 'ão' : 'ões'} · {pct.toFixed(1)}%
                  </div>
                </div>
                <div className={toneClass}>{formatBRL(r.total)}</div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
