/**
 * Valida header `authorization: Bearer <CRON_SECRET>` para endpoints de cron.
 * Compatível com o formato do Vercel Cron, mas funciona com qualquer scheduler
 * que envie esse header.
 */
export function validateCronSecret(request: Request): boolean {
  const expected = process.env['CRON_SECRET'];
  if (!expected) return false;
  const header = request.headers.get('authorization') ?? '';
  const prefix = 'Bearer ';
  if (!header.startsWith(prefix)) return false;
  return header.slice(prefix.length) === expected;
}
