import type { LlmTransaction } from './schemas';

export function calculateConfidence(extracted: Partial<LlmTransaction>): number {
  let score = 1.0;
  if (!extracted.category) score -= 0.2;
  if (!extracted.transactionDate) score -= 0.15;
  if (!extracted.amount) score -= 0.3;
  if (!extracted.type) score -= 0.3;
  return Math.max(0, score);
}
