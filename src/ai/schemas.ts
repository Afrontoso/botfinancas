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

export const LlmRecurringSchema = z.object({
  intent: z.literal('create_recurring'),
  name: z.string().min(1),
  expectedAmount: z.number().positive(),
  currency: z.string().default('BRL'),
  type: z.enum(['expense', 'income']).default('expense'),
  category: z.string().optional(),
  periodicity: z.enum(['monthly', 'weekly', 'yearly']),
  expectedDay: z.number().int().min(1).max(366),
  confidence: z.number().min(0).max(1),
});

export type LlmRecurring = z.infer<typeof LlmRecurringSchema>;

export const LlmOutputSchema = z.discriminatedUnion('intent', [
  LlmTransactionSchema,
  LlmQuerySchema,
  LlmRecurringSchema,
]);

export type LlmOutput = z.infer<typeof LlmOutputSchema>;
