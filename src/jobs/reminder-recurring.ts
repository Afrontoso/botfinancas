import { PrismaClient, Reminder } from '@prisma/client';
import { startOfMonth, endOfMonth, setDate } from 'date-fns';

export async function generateRecurringReminders(
  prisma: PrismaClient,
  today: Date,
): Promise<Reminder[]> {
  const dayOfMonth = today.getUTCDate();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const dueRecurrings = await prisma.recurringExpense.findMany({
    where: {
      active: true,
      periodicity: 'monthly',
      expectedDay: { lte: dayOfMonth },
    },
  });

  const created: Reminder[] = [];

  for (const rec of dueRecurrings) {
    const matching = await prisma.transaction.findFirst({
      where: {
        userId: rec.userId,
        type: rec.type,
        transactionDate: { gte: monthStart, lte: monthEnd },
        ...(rec.categoryId ? { categoryId: rec.categoryId } : {}),
      },
    });
    if (matching) continue;

    const existing = await prisma.reminder.findFirst({
      where: {
        userId: rec.userId,
        type: 'recurring_missing',
        recurringExpenseId: rec.id,
        scheduledFor: { gte: monthStart, lte: monthEnd },
      },
    });
    if (existing) continue;

    const reminder = await prisma.reminder.create({
      data: {
        userId: rec.userId,
        type: 'recurring_missing',
        scheduledFor: setDate(today, rec.expectedDay),
        recurringExpenseId: rec.id,
        payload: {
          recurringName: rec.name,
          expectedAmount: Number(rec.expectedAmount),
          expectedDay: rec.expectedDay,
        },
      },
    });
    created.push(reminder);
  }

  return created;
}
