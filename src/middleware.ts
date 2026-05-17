import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decideAuth, SESSION_COOKIE_NAMES } from './lib/middleware-auth';

export function middleware(request: NextRequest) {
  const hasSession = SESSION_COOKIE_NAMES.some(
    (name) => request.cookies.get(name)?.value,
  );
  const decision = decideAuth(request.nextUrl.pathname, Boolean(hasSession));

  if (decision.kind === 'redirect') {
    const url = request.nextUrl.clone();
    url.pathname = decision.to;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Roda em todas as rotas exceto assets estáticos do Next e arquivos públicos
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|css|js)$).*)'],
};
