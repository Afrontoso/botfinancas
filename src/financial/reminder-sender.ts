import type { PrismaClient, Reminder, User, ReminderType } from '@prisma/client';
import { markSent } from './reminder-service';

export type SendMessageFn = (chatId: string, text: string) => Promise<void>;

type ReminderShape = { type: ReminderType; payload: unknown };

export function formatReminderMessage(reminder: ReminderShape): string {
  const p = (reminder.payload ?? {}) as Record<string, unknown>;
  switch (reminder.type) {
    case 'recurring_missing': {
      const name = String(p['recurringName'] ?? 'gasto recorrente');
      const amount = Number(p['expectedAmount'] ?? 0).toFixed(2);
      const day = p['expectedDay'];
      return `🔔 Lembrete: você ainda não registrou "${name}" (R$ ${amount}) esse mês${day ? ` — esperado dia ${day}` : ''}.`;
    }
    case 'invoice_due': {
      const account = String(p['accountName'] ?? 'cartão');
      const total = Number(p['totalAmount'] ?? 0).toFixed(2);
      const due = String(p['dueDate'] ?? '');
      return `💳 Fatura do ${account} vence em ${due} — total R$ ${total}.`;
    }
    case 'budget_alert': {
      const category = String(p['categoryName'] ?? 'categoria');
      const used = Number(p['used'] ?? 0).toFixed(2);
      const limit = Number(p['limit'] ?? 0).toFixed(2);
      return `⚠️ Orçamento de "${category}" em R$ ${used} de R$ ${limit}.`;
    }
    case 'custom':
    default:
      return `📌 ${String(p['message'] ?? 'Lembrete')}`;
  }
}

/**
 * Envia o reminder via sendFn e marca como enviado em caso de sucesso.
 * Se sendFn lança, NÃO marca — assim o cron pega de novo no próximo tick.
 */
export async function sendReminder(
  prisma: PrismaClient,
  sendFn: SendMessageFn,
  reminder: Reminder,
  user: User,
): Promise<void> {
  const text = formatReminderMessage(reminder);
  await sendFn(user.telegramUserId, text);
  await markSent(prisma, reminder.id);
}
