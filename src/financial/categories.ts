import { PrismaClient, Category, CategoryType } from '@prisma/client';

const transactionTypeToCategoryType: Record<string, CategoryType> = {
  expense: CategoryType.expense,
  income: CategoryType.income,
  transfer: CategoryType.transfer,
};

function normalizeName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function toCategoryType(transactionType: string): CategoryType {
  return transactionTypeToCategoryType[transactionType] ?? CategoryType.expense;
}

export async function findOrCreateCategory(
  prisma: PrismaClient,
  userId: string,
  name: string,
  transactionType: string,
): Promise<Category> {
  const existing = await prisma.category.findFirst({
    where: {
      userId,
      name: { equals: name.trim(), mode: 'insensitive' },
    },
  });

  if (existing !== null) {
    return existing;
  }

  return prisma.category.create({
    data: {
      userId,
      name: normalizeName(name),
      type: toCategoryType(transactionType),
    },
  });
}
