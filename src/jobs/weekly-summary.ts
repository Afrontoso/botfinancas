import { PrismaClient, Reminder } from '@prisma/client';
import { subDays, startOfDay } from 'date-fns';
import { computeBalance, listByCategory } from '../financial/queries';
import { createReminder } from '../financial/reminder-service';

/**
 * Para cada usuário, gera um Reminder com o resumo dos últimos 7 dias
 * (receitas, despesas, líquido e top 3 categorias de despesa). Idempotente
 * por dia: se já existir resumo gerado hoje, pula.
 */
export async function generateWeeklySummaryReminders(
  prisma: PrismaClient,
  today: Date,
): Promise<Reminder[]> {
  const todayStart = startOfDay(today);
  const from = subDays(todayStart, 7);
  const users = await prisma.user.findMany();
  const created: Reminder[] = [];

  for (const user of users) {
    const existing = await prisma.reminder.findFirst({
      where: {
        userId: user.id,
        type: 'custom',
        scheduledFor: { gte: todayStart },
        payload: { path: ['kind'], equals: 'weekly_summary' },
      },
    });
    if (existing) continue;

    const [balance, expenses] = await Promise.all([
      computeBalance(prisma, user.id, from, today),
      listByCategory(prisma, user.id, 'expense', from, today),
    ]);
    const topCategories = [...expenses]
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
      .map((c) => `${c.categoryName}: R$ ${c.total.toFixed(2)}`);

    const lines = [
      `📊 Resumo da semana (últimos 7 dias):`,
      `Receitas: R$ ${balance.income.toFixed(2)}`,
      `Despesas: R$ ${balance.expense.toFixed(2)}`,
      `Líquido: R$ ${balance.net.toFixed(2)}`,
    ];
    if (topCategories.length > 0) {
      lines.push(``, `Top categorias:`, ...topCategories.map((c) => `• ${c}`));
    }
    const message = lines.join('\n');

    const reminder = await createReminder(prisma, {
      userId: user.id,
      type: 'custom',
      scheduledFor: today,
      payload: {
        kind: 'weekly_summary',
        message,
        income: balance.income,
        expense: balance.expense,
        net: balance.net,
        topCategories: expenses.slice(0, 3).map((c) => ({
          name: c.categoryName,
          total: c.total,
          count: c.count,
        })),
      },
    });
    created.push(reminder);
  }

  return created;
}
