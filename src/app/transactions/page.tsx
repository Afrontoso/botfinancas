import type { ReactElement } from 'react';
import { prisma } from '../../lib/prisma';
import { getCurrentUser } from '../../lib/current-user';
import { listTransactionsPaginated } from '../../financial/queries';
import { TransactionsView } from '../../components/transactions-view';

const PAGE_SIZE = 20;

type SearchParams = Record<string, string | string[] | undefined>;

function parseFilter(params: SearchParams): {
  page: number;
  type?: 'expense' | 'income';
  categoryId?: string;
} {
  const pageRaw = typeof params.page === 'string' ? Number(params.page) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
  const typeRaw = typeof params.type === 'string' ? params.type : undefined;
  const type = typeRaw === 'expense' || typeRaw === 'income' ? typeRaw : undefined;
  const categoryId = typeof params.categoryId === 'string' && params.categoryId
    ? params.categoryId
    : undefined;
  return { page, type, categoryId };
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<ReactElement> {
  const user = await getCurrentUser();
  const { page, type, categoryId } = parseFilter(searchParams);
  const offset = (page - 1) * PAGE_SIZE;

  const [{ items, total }, categories] = await Promise.all([
    listTransactionsPaginated(prisma, user.id, offset, PAGE_SIZE, { type, categoryId }),
    prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <TransactionsView
      items={items}
      total={total}
      page={page}
      pageSize={PAGE_SIZE}
      filter={{ type, categoryId }}
      categories={categories}
    />
  );
}
