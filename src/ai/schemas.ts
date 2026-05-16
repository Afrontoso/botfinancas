import { z } from 'zod';

export const LlmTransactionSchema = z.object({
  intent: z.literal('create_transaction'),
  type: z.enum(['expense', 'income', 'transfer', 'adjustment']),
  amount: z.number().positive(),
  currency: z.string().default('BRL'),
  description: z.string().min(1),
  category: z.string().optional(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMethod: z.string().nullable().optional(),
  isInvoicePayment: z.boolean().optional(),
  confidence: z.number().min(0).max(1),
});

export type LlmTransaction = z.infer<typeof LlmTransactionSchema>;

export const LlmQuerySchema = z.object({
  intent: z.literal('query'),
  queryType: z.enum(['balance', 'expense_by_category', 'recent_transactions', 'unknown']),
  period: z
    .object({
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })
    .optional(),
  category: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export type LlmQuery = z.infer<typeof LlmQuerySchema>;

export const LlmOutputSchema = z.discriminatedUnion('intent', [
  LlmTransactionSchema,
  LlmQuerySchema,
]);

export type LlmOutput = z.infer<typeof LlmOutputSchema>;
