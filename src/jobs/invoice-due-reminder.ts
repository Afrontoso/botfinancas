import { PrismaClient, Reminder } from '@prisma/client';
import { addDays, startOfDay } from 'date-fns';
import { createReminder } from '../financial/reminder-service';

/**
 * Para cada Invoice ainda não paga com dueDate dentro de [today, today+3],
 * cria um Reminder do tipo invoice_due — desde que ainda não exista um para
 * essa invoice (idempotente: o cron pode rodar várias vezes no mesmo dia).
 */
export async function generateInvoiceDueReminders(
  prisma: PrismaClient,
  today: Date,
): Promise<Reminder[]> {
  const windowStart = startOfDay(today);
  const windowEnd = addDays(windowStart, 3);

  const invoices = await prisma.invoice.findMany({
    where: {
      dueDate: { gte: windowStart, lte: windowEnd },
      status: { in: ['open', 'closed', 'partial'] },
    },
    include: { account: true },
  });

  const created: Reminder[] = [];

  for (const invoice of invoices) {
    // checa se já existe QUALQUER Reminder pra essa invoice (pending, sent, etc) —
    // queremos no máximo 1 reminder por invoice por ciclo, independente do envio
    // já ter acontecido nesse cron-run anterior.
    const existing = await prisma.reminder.findFirst({
      where: {
        userId: invoice.account.userId,
        type: 'invoice_due',
        payload: { path: ['invoiceId'], equals: invoice.id },
      },
    });
    if (existing) continue;

    const reminder = await createReminder(prisma, {
      userId: invoice.account.userId,
      type: 'invoice_due',
      scheduledFor: today,
      payload: {
        invoiceId: invoice.id,
        accountName: invoice.account.name,
        totalAmount: Number(invoice.totalAmount),
        paidAmount: Number(invoice.paidAmount),
        dueDate: invoice.dueDate.toISOString().slice(0, 10),
      },
    });
    created.push(reminder);
  }

  return created;
}
