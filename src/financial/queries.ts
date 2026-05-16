import { PrismaClient, Transaction, Category } from '@prisma/client';

type TxType = 'expense' | 'income';

function periodFilter(from?: Date, to?: Date) {
  if (!from || !to) return {};
  return { transactionDate: { gte: from, lte: to } };
}

export async function sumByPeriod(
  prisma: PrismaClient,
  userId: string,
  type: TxType,
  from?: Date,
  to?: Date,
): Promise<number> {
  const result = await prisma.transaction.aggregate({
    where: { userId, type, ...periodFilter(from, to) },
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0);
}

export type CategoryBreakdown = {
  categoryName: string;
  total: number;
  count: number;
};

export async function listByCategory(
  prisma: PrismaClient,
  userId: string,
  type: TxType,
  from?: Date,
  to?: Date,
): Promise<CategoryBreakdown[]> {
  const grouped = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { userId, type, ...periodFilter(from, to) },
    _sum: { amount: true },
    _count: { _all: true },
  });

  if (grouped.length === 0) return [];

  const categoryIds = grouped
    .map((g) => g.categoryId)
    .filter((id): id is string => id !== null);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });
  const nameById = new Map<string, string>(categories.map((c) => [c.id, c.name]));

  return grouped.map((g) => ({
    categoryName: g.categoryId ? (nameById.get(g.categoryId) ?? 'Sem categoria') : 'Sem categoria',
    total: Number(g._sum.amount ?? 0),
    count: g._count._all,
  }));
}

export type TransactionWithCategory = Transaction & { category: Category | null };

export async function listRecent(
  prisma: PrismaClient,
  userId: string,
  limit: number,
): Promise<TransactionWithCategory[]> {
  return prisma.transaction.findMany({
    where: { userId },
    orderBy: { transactionDate: 'desc' },
    take: limit,
    include: { category: true },
  });
}

export type BalanceResult = {
  income: number;
  expense: number;
  net: number;
};

export async function computeBalance(
  prisma: PrismaClient,
  userId: string,
  from?: Date,
  to?: Date,
): Promise<BalanceResult> {
  const [income, expense] = await Promise.all([
    sumByPeriod(prisma, userId, 'income', from, to),
    sumByPeriod(prisma, userId, 'expense', from, to),
  ]);
  return { income, expense, net: income - expense };
}
