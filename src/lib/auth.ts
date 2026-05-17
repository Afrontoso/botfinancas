import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

/**
 * Config do NextAuth v5 (Auth.js). Provider: Google.
 * Sessão via banco (não JWT) — o Prisma Adapter mantém a Session row.
 *
 * O User do projeto continua sendo o mesmo do Telegram; o vínculo entre
 * a conta web (Google) e o User do Telegram é feito em T-104 via código de
 * verificação. Aqui o NextAuth cria/encontra um User pela conta Google;
 * o /vincular faz o merge.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
  providers: [
    Google({
      clientId: process.env['GOOGLE_CLIENT_ID'] ?? '',
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'] ?? '',
    }),
  ],
  pages: {
    signIn: '/signin',
  },
});
