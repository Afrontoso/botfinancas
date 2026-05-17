import Link from 'next/link';
import type { ReactElement } from 'react';
import type { TransactionWithCategory } from '../financial/queries';
import { PageHeader } from './ui/page-header';
import { formatBRL } from './ui/format';
import { ExportButtons } from './export-buttons';

export type TransactionsViewProps = {
  items: TransactionWithCategory[];
  total: number;
  page: number;
  pageSize: number;
  filter: { type?: 'expense' | 'income'; categoryId?: string };
  categories: { id: string; name: string }[];
};

export function TransactionsView({
  items,
  total,
  page,
  pageSize,
  filter,
  categories,
}: TransactionsViewProps): ReactElement {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Transações"
          subtitle={`${total} registro${total === 1 ? '' : 's'} · página ${page} de ${totalPages}`}
        />
        <ExportButtons filter={filter} />
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--border)] bg-[#0a0c10] p-4"
      >
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-[var(--muted)]">Tipo</span>
          <select
            name="type"
            defaultValue={filter.type ?? ''}
            className="rounded-md border border-[var(--border)] bg-transparent px-2 py-1 text-sm"
          >
            <option value="">Todos</option>
            <option value="expense">Despesas</option>
            <option value="income">Receitas</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-[var(--muted)]">Categoria</span>
          <select
            name="categoryId"
            defaultValue={filter.categoryId ?? ''}
            className="rounded-md border border-[var(--border)] bg-transparent px-2 py-1 text-sm"
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md border border-[var(--border)] px-3 py-1 text-sm hover:bg-[var(--border)]"
        >
          Filtrar
        </button>
      </form>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Nenhuma transação encontrada.</p>
      ) : (
        <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
          {items.map((t) => (
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
                {t.type === 'expense' ? '-' : '+'}{formatBRL(t.amount)}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} filter={filter} />
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  filter,
}: {
  page: number;
  totalPages: number;
  filter: { type?: string; categoryId?: string };
}): ReactElement {
  const buildHref = (target: number): string => {
    const params = new URLSearchParams();
    params.set('page', String(target));
    if (filter.type) params.set('type', filter.type);
    if (filter.categoryId) params.set('categoryId', filter.categoryId);
    return `/transactions?${params.toString()}`;
  };

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav className="flex items-center justify-between text-sm" aria-label="Paginação">
      {prevDisabled ? (
        <span className="text-[var(--muted)]">← Anterior</span>
      ) : (
        <Link href={buildHref(page - 1)} className="hover:underline">
          ← Anterior
        </Link>
      )}
      <span className="text-[var(--muted)]">
        Página {page} de {totalPages}
      </span>
      {nextDisabled ? (
        <span className="text-[var(--muted)]">Próxima →</span>
      ) : (
        <Link href={buildHref(page + 1)} className="hover:underline">
          Próxima →
        </Link>
      )}
    </nav>
  );
}
