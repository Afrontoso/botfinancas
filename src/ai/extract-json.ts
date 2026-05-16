export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

/**
 * Extracts the first valid JSON object from a raw string.
 * Handles plain JSON, markdown code fences, and JSON surrounded by text.
 * Throws ParseError when no valid JSON object is found.
 */
export function extractJson(rawText: string): Record<string, unknown> {
  const trimmed = rawText.trim();

  // Strategy 1: direct parse
  const direct = tryParse(trimmed);
  if (direct !== null) return direct;

  // Strategy 2: ```json ... ``` fence
  const jsonFenceMatch = /```json\s*([\s\S]*?)\s*```/.exec(trimmed);
  if (jsonFenceMatch?.[1] !== undefined) {
    const parsed = tryParse(jsonFenceMatch[1].trim());
    if (parsed !== null) return parsed;
  }

  // Strategy 3: ``` ... ``` fence (no language tag)
  const genericFenceMatch = /```\s*([\s\S]*?)\s*```/.exec(trimmed);
  if (genericFenceMatch?.[1] !== undefined) {
    const parsed = tryParse(genericFenceMatch[1].trim());
    if (parsed !== null) return parsed;
  }

  // Strategy 4: find first { and extract balanced braces
  const extracted = extractBalancedObject(trimmed);
  if (extracted !== null) {
    const parsed = tryParse(extracted);
    if (parsed !== null) return parsed;
    throw new ParseError(
      `Found JSON-like substring but it is malformed: ${extracted.slice(0, 80)}`
    );
  }

  throw new ParseError('No JSON object found in the provided string');
}

function tryParse(text: string): Record<string, unknown> | null {
  try {
    const value = JSON.parse(text) as unknown;
    if (isRecord(value)) return value;
    return null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Finds the first '{' and extracts up to the matching '}', respecting nesting.
 * Returns null if no opening brace is found.
 */
function extractBalancedObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === undefined) break;

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === '\\' && inString) {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  // Opening brace found but never closed — return what we have so caller can throw
  return text.slice(start);
}
