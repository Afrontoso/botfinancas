import { prisma } from './prisma';
import type { User } from '@prisma/client';

/**
 * TODO(S-9): substituir por usuário da sessão NextAuth.
 * Por ora, retorna o primeiro User do banco — modelo single-user do MVP.
 */
export async function getCurrentUser(): Promise<User> {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!user) {
    throw new Error('Nenhum User encontrado no banco. Envie ao menos uma mensagem no Telegram primeiro.');
  }
  return user;
}
