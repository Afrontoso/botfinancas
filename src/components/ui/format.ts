/**
 * Decimal-from-Prisma chega como objeto; Number() faz o coerce.
 */
export function formatBRL(value: number | { toString(): string }): string {
  const n = typeof value === 'number' ? value : Number(value);
  return `R$ ${n.toFixed(2)}`;
}
