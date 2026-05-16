import { extractJson } from './extract-json';
import { sanitize } from './sanitize';
import { LlmOutputSchema } from './schemas';
import type { LlmOutput } from './schemas';
import { calculateConfidence } from './confidence';

export class AiParseError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'AiParseError';
  }
}

export async function parseAiResponse(rawText: string): Promise<LlmOutput> {
  let raw: Record<string, unknown>;
  try {
    raw = extractJson(rawText);
  } catch (err) {
    throw new AiParseError('Failed to extract JSON from AI response', err);
  }

  const cleaned = sanitize(raw);

  const parsed = LlmOutputSchema.safeParse(cleaned);
  if (!parsed.success) {
    throw new AiParseError('AI response failed schema validation', parsed.error);
  }

  const result = parsed.data;

  if (result.intent === 'create_transaction') {
    const confidence = calculateConfidence(result);
    return { ...result, confidence };
  }

  return result;
}
