export type Intent = 'create_transaction' | 'query' | 'create_recurring';

const QUERY_PATTERNS = [
  /\bquanto\b/i,
  /\bextrato\b/i,
  /\bsaldo\b/i,
  /\bme mostra\b/i,
  /\bmostra\b/i,
  /\bgastos\b/i,
  /\brelatório\b/i,
  /\brelatorio\b/i,
];

const RECURRING_PATTERNS = [
  /\btodo\s+dia\s+\d+\b/i,
  /\btodo\s+mês\b/i,
  /\btodo\s+mes\b/i,
  /\btoda\s+semana\b/i,
  /\bmensalmente\b/i,
  /\bsemanalmente\b/i,
  /\banualmente\b/i,
];

export function detectIntent(message: string): Intent {
  if (RECURRING_PATTERNS.some((re) => re.test(message))) {
    return 'create_recurring';
  }
  if (QUERY_PATTERNS.some((re) => re.test(message))) {
    return 'query';
  }
  return 'create_transaction';
}
