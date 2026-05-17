import { redirect } from 'next/navigation';
import type { User } from '@prisma/client';
import { auth } from './auth';
import { prisma } from './prisma';

/**
 * Retorna o User do Telegram associado à sessão web atual.
 *
 * Fluxo (após S-9):
 *   1. Lê a sessão NextAuth — sem sessão, redireciona pra /signin.
 *   2. Acha o Account Google da sessão.
 *   3. Acha o User Telegram com linkedAccountId === Account.id (vínculo feito
 *      em /dashboard/link).
 *   4. Sem vínculo, redireciona pra /dashboard/link.
 *
 * Server components que usam isso assumem que estão atrás do middleware
 * de auth — então a redireção pra /signin é só fallback defensivo.
 */
export async function getCurrentUser(): Promise<User> {
  const session = await auth();
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) {
    redirect('/signin');
  }

  const account = await prisma.account.findFirst({
    where: { userId: sessionUserId, provider: 'google' },
  });
  if (!account) {
    redirect('/signin');
  }

  const linkedUser = await prisma.user.findUnique({
    where: { linkedAccountId: account.id },
  });
  if (!linkedUser) {
    redirect('/dashboard/link');
  }
  return linkedUser;
}
