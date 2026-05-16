import { Transaction } from '@prisma/client';
import type { LlmClient } from '../ai/llm-client';
import { detectIntent } from '../ai/intent';
import { loadPrompt } from '../ai/prompt-loader';
import { parseAiResponse } from '../ai/service';
import { findOrCreateCategory } from './categories';
import { handleQuery } from './query-handler';
import { payInvoice } from './invoice-payment';
import { prisma } from '../lib/prisma';

export type ProcessResult = {
  type: 'created' | 'rejected' | 'query' | 'unknown';
  transaction?: Transaction;
  reply: string;
};

export async function processMessage(
  message: string,
  userId: string,
  llm: LlmClient,
): Promise<ProcessResult> {
  const intent = detectIntent(message);

  if (intent === 'query') {
    const reply = await handleQuery(message, userId, llm);
    return { type: 'query', reply };
  }

  if (intent !== 'create_transaction') {
    return { type: 'unknown', reply: 'Não entendi. Pode descrever uma transação financeira?' };
  }

  let aiOutput: Awaited<ReturnType<typeof parseAiResponse>>;
  try {
    const prompt = loadPrompt('transaction-extraction.v1', { USER_MESSAGE: message });
    const rawText = await llm.complete(prompt);
    aiOutput = await parseAiResponse(rawText);
  } catch {
    return { type: 'rejected', reply: 'Não consegui entender a transação. Por favor, tente novamente.' };
  }

  if (aiOutput.intent !== 'create_transaction') {
    return { type: 'rejected', reply: 'Não consegui identificar uma transação.' };
  }

  const tx = aiOutput;

  if (tx.isInvoicePayment === true && tx.paymentMethod) {
    const account = await prisma.account.findFirst({
      where: {
        userId,
        type: 'credit_card',
        name: { equals: tx.paymentMethod, mode: 'insensitive' },
      },
    });
    if (account) {
      const openInvoice = await prisma.invoice.findFirst({
        where: { accountId: account.id, status: { in: ['open', 'partial'] } },
        orderBy: { dueDate: 'asc' },
      });
      if (openInvoice) {
        const { transaction, invoice: updatedInvoice } = await payInvoice(
          prisma,
          userId,
          openInvoice.id,
          tx.amount,
          {
            description: tx.description,
            paymentMethod: tx.paymentMethod,
            paymentDate: new Date(tx.transactionDate),
          },
        );
        const reply = `✅ Pagamento de R$${Number(tx.amount).toFixed(2)} registrado na fatura ${account.name} (saldo restante: R$${(Number(updatedInvoice.totalAmount) - Number(updatedInvoice.paidAmount)).toFixed(2)})`;
        return { type: 'created', transaction, reply };
      }
    }
  }

  let categoryId: string | undefined;
  if (tx.category) {
    const category = await findOrCreateCategory(prisma, userId, tx.category, tx.type);
    categoryId = category.id;
  }

  let invoiceId: string | undefined;
  if (tx.paymentMethod) {
    const account = await prisma.account.findFirst({
      where: {
        userId,
        type: 'credit_card',
        name: { equals: tx.paymentMethod, mode: 'insensitive' },
      },
    });
    if (account) {
      const invoice = await prisma.invoice.findFirst({
        where: { accountId: account.id, status: 'open' },
      });
      if (invoice) {
        invoiceId = invoice.id;
      }
    }
  }

  const transactionData = {
    userId,
    categoryId,
    invoiceId,
    type: tx.type,
    amount: tx.amount,
    currency: tx.currency,
    description: tx.description,
    transactionDate: new Date(tx.transactionDate),
    paymentMethod: tx.paymentMethod ?? null,
    confidence: tx.confidence,
    source: 'telegram_text' as const,
  };

  let transaction: Transaction;
  if (invoiceId) {
    const [created] = await prisma.$transaction([
      prisma.transaction.create({ data: transactionData }),
      prisma.invoice.update({
        where: { id: invoiceId },
        data: { totalAmount: { increment: tx.amount } },
      }),
    ]);
    transaction = created;
  } else {
    transaction = await prisma.transaction.create({ data: transactionData });
  }

  const typeLabel = tx.type === 'expense' ? 'Despesa' : tx.type === 'income' ? 'Receita' : 'Transação';
  const reply = `✅ ${typeLabel} de R$${Number(tx.amount).toFixed(2)} registrada: ${tx.description}`;

  return { type: 'created', transaction, reply };
}
