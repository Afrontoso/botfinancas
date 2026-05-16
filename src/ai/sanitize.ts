const DD_MM_YYYY = /^(\d{2})\/(\d{2})\/(\d{4})$/;

function parseAmount(value: string): number | string {
  if (value.includes(',')) {
    // Brazilian format: "." is thousands separator, "," is decimal separator
    const normalized = value.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? value : parsed;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? value : parsed;
}

function normalizeDate(value: string): string {
  const match = DD_MM_YYYY.exec(value);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }
  return value;
}

export function sanitize(raw: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (key === 'amount' && typeof value === 'string') {
      result[key] = parseAmount(value);
    } else if (key === 'transactionDate' && typeof value === 'string') {
      result[key] = normalizeDate(value);
    } else if (typeof value === 'string') {
      result[key] = value.trim();
    } else {
      result[key] = value;
    }
  }

  return result;
}
