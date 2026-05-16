export type Intent = 'create_transaction' | 'query';

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

export function detectIntent(message: string): Intent {
  const hasQuery = QUERY_PATTERNS.some((re) => re.test(message));

  // Query signals take priority; ambiguous text defaults to create_transaction
  if (hasQuery) {
    return 'query';
  }

  return 'create_transaction';
}
