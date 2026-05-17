import type { TransactionWithCategory } from './queries';

const HEADER = ['date', 'type', 'description', 'category', 'amount', 'currency'] as const;

function escapeField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function transactionsToCsv(transactions: TransactionWithCategory[]): string {
  const rows = transactions.map((t) => {
    const date = t.transactionDate.toISOString().slice(0, 10);
    const category = t.category?.name ?? 'Sem categoria';
    const amount = Number(t.amount).toFixed(2);
    return [
      date,
      t.type,
      escapeField(t.description),
      escapeField(category),
      amount,
      t.currency,
    ].join(',');
  });

  return [HEADER.join(','), ...rows].join('\n') + '\n';
}
