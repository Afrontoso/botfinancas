import { PrismaClient, Prisma, Reminder, ReminderType } from '@prisma/client';

export type CreateReminderInput = {
  userId: string;
  type: ReminderType;
  scheduledFor: Date;
  payload: Prisma.InputJsonValue;
  recurringExpenseId?: string;
};

export async function createReminder(
  prisma: PrismaClient,
  input: CreateReminderInput,
): Promise<Reminder> {
  return prisma.reminder.create({
    data: {
      userId: input.userId,
      type: input.type,
      scheduledFor: input.scheduledFor,
      payload: input.payload,
      ...(input.recurringExpenseId ? { recurringExpenseId: input.recurringExpenseId } : {}),
    },
  });
}

export async function listPending(prisma: PrismaClient, userId: string): Promise<Reminder[]> {
  return prisma.reminder.findMany({
    where: { userId, status: 'pending' },
    orderBy: { scheduledFor: 'asc' },
  });
}

export async function markSent(prisma: PrismaClient, reminderId: string): Promise<Reminder> {
  return prisma.reminder.update({
    where: { id: reminderId },
    data: { status: 'sent', sentAt: new Date() },
  });
}

/**
 * findDue varre TODOS os users — é usado pelo sender/cron, não por queries de UI.
 * Para listar pending de um usuário específico, use listPending.
 */
export async function findDue(prisma: PrismaClient, now: Date): Promise<Reminder[]> {
  return prisma.reminder.findMany({
    where: { status: 'pending', scheduledFor: { lte: now } },
    orderBy: { scheduledFor: 'asc' },
  });
}
