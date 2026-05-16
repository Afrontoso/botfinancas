import { PrismaClient, RecurringExpense, RecurringPeriod, TransactionType } from '@prisma/client';

export type CreateRecurringInput = {
  userId: string;
  name: string;
  expectedAmount: number;
  periodicity: RecurringPeriod;
  expectedDay: number;
  currency?: string;
  type?: TransactionType;
  categoryId?: string;
  accountId?: string;
};

export async function createRecurring(
  prisma: PrismaClient,
  input: CreateRecurringInput,
): Promise<RecurringExpense> {
  return prisma.recurringExpense.create({
    data: {
      userId: input.userId,
      name: input.name,
      expectedAmount: input.expectedAmount,
      currency: input.currency ?? 'BRL',
      type: input.type ?? 'expense',
      periodicity: input.periodicity,
      expectedDay: input.expectedDay,
      categoryId: input.categoryId,
      accountId: input.accountId,
    },
  });
}

export async function listRecurring(
  prisma: PrismaClient,
  userId: string,
): Promise<RecurringExpense[]> {
  return prisma.recurringExpense.findMany({
    where: { userId },
    orderBy: { expectedDay: 'asc' },
  });
}

export async function toggleActive(
  prisma: PrismaClient,
  id: string,
  active: boolean,
): Promise<RecurringExpense> {
  return prisma.recurringExpense.update({
    where: { id },
    data: { active },
  });
}

export async function findDueOn(
  prisma: PrismaClient,
  userId: string,
  dayOfMonth: number,
): Promise<RecurringExpense[]> {
  return prisma.recurringExpense.findMany({
    where: { userId, active: true, expectedDay: dayOfMonth },
  });
}
