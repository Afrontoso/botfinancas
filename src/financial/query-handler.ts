import { startOfMonth, endOfMonth } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import type { LlmClient } from '../ai/llm-client';
import type { LlmQuery } from '../ai/schemas';
import { loadPrompt } from '../ai/prompt-loader';
import { parseAiResponse } from '../ai/service';
import { prisma } from '../lib/prisma';
import { computeBalance, listByCategory, listRecent } from './queries';

const FALLBACK = 'Desculpe, não entendi sua pergunta. Pode reformular?';

export async function handleQuery(
  message: string,
  userId: string,
  llm: LlmClient,
): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error(`handleQuery: user not found: ${userId}`);

  const tz = user.timezone;
  const now = new Date();
  const today = formatInTimeZone(now, tz, 'yyyy-MM-dd');
  const zoned = toZonedTime(now, tz);
  const monthStart = formatInTimeZone(startOfMonth(zoned), tz, 'yyyy-MM-dd');
  const monthEnd = formatInTimeZone(endOfMonth(zoned), tz, 'yyyy-MM-dd');

  const prompt = loadPrompt('query-extraction.v1', {
    USER_MESSAGE: message,
    TODAY: today,
    MONTH_START: monthStart,
    MONTH_END: monthEnd,
  });

  let parsed: Awaited<ReturnType<typeof parseAiResponse>>;
  try {
    const raw = await llm.complete(prompt);
    parsed = await parseAiResponse(raw);
  } catch {
    return FALLBACK;
  }

  if (parsed.intent !== 'query') {
    return FALLBACK;
  }

  return formatQueryReply(parsed, userId);
}

async function formatQueryReply(query: LlmQuery, userId: string): Promise<string> {
  const from = query.period ? new Date(query.period.from) : undefined;
  const to = query.period ? new Date(query.period.to) : undefined;
  const periodLabel = query.period ? ` (${query.period.from} a ${query.period.to})` : '';

  switch (query.queryType) {
    case 'balance': {
      const b = await computeBalance(prisma, userId, from, to);
      return [
        `📊 Resumo${periodLabel}:`,
        `💰 Receitas: R$${b.income.toFixed(2)}`,
        `💸 Despesas: R$${b.expense.toFixed(2)}`,
        `📊 Saldo: R$${b.net.toFixed(2)}`,
      ].join('\n');
    }

    case 'expense_by_category': {
      const breakdown = await listByCategory(prisma, userId, 'expense', from, to);
      if (query.category) {
        const cat = breakdown.find(
          (r) => r.categoryName.toLowerCase() === query.category!.toLowerCase(),
        );
        return cat
          ? `💸 ${cat.categoryName}${periodLabel}: R$${cat.total.toFixed(2)} (${cat.count} transações)`
          : `Nenhum gasto encontrado para "${query.category}"${periodLabel}.`;
      }
      if (breakdown.length === 0) {
        return `Nenhum gasto encontrado${periodLabel}.`;
      }
      const lines = breakdown
        .sort((a, b) => b.total - a.total)
        .map((b) => `${b.categoryName}: R$${b.total.toFixed(2)} (${b.count})`)
        .join('\n');
      return `💸 Gastos por categoria${periodLabel}:\n${lines}`;
    }

    case 'recent_transactions': {
      const recent = await listRecent(prisma, userId, 10);
      if (recent.length === 0) return 'Nenhuma transação registrada ainda.';
      const lines = recent
        .map((t) => {
          const date = t.transactionDate.toISOString().slice(0, 10);
          const sign = t.type === 'expense' ? '-' : '+';
          return `📅 ${date}: ${sign}R$${Number(t.amount).toFixed(2)} — ${t.description}`;
        })
        .join('\n');
      return `Últimas transações:\n${lines}`;
    }

    case 'unknown':
    default:
      return FALLBACK;
  }
}
