/**
 * Decide se uma request precisa ser redirecionada pro /signin.
 *
 * Mantemos a função pura (sem deps de Next/Auth.js) pra rodar em testes Node
 * e no Edge Runtime do middleware sem importar o adapter Prisma (que não roda
 * em Edge). A verificação de cookie é cosmética — autorização real acontece
 * nos server components/route handlers chamando `auth()`.
 */

const PUBLIC_API_PREFIXES = ['/api/auth/', '/api/webhooks/', '/api/cron/'];
const PUBLIC_PAGES = ['/signin'];
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/transactions',
  '/categories',
  '/invoices',
  '/api/export',
];

export type AuthDecision =
  | { kind: 'allow' }
  | { kind: 'redirect'; to: string };

export function decideAuth(pathname: string, hasSessionCookie: boolean): AuthDecision {
  // API públicas sempre passam
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return { kind: 'allow' };
  }
  // Páginas públicas
  if (PUBLIC_PAGES.includes(pathname)) {
    return { kind: 'allow' };
  }
  // Rotas protegidas exigem cookie de sessão
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !hasSessionCookie) {
    return { kind: 'redirect', to: '/signin' };
  }
  return { kind: 'allow' };
}

/**
 * Nome do cookie de sessão do NextAuth v5 (Auth.js). Em produção (HTTPS) usa
 * o prefixo __Secure-; em dev usa o nome simples.
 */
export const SESSION_COOKIE_NAMES = ['authjs.session-token', '__Secure-authjs.session-token'];
