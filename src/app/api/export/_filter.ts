import type { TransactionsFilter } from '../../../financial/queries';

export function parseExportFilter(searchParams: URLSearchParams): TransactionsFilter {
  const typeRaw = searchParams.get('type');
  const type = typeRaw === 'expense' || typeRaw === 'income' ? typeRaw : undefined;
  const categoryId = searchParams.get('categoryId') ?? undefined;
  const from = parseDate(searchParams.get('from'));
  const to = parseDate(searchParams.get('to'));
  return {
    ...(type ? { type } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
}

function parseDate(raw: string | null): Date | undefined {
  if (!raw) return undefined;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
