import type { PrismaClient, User } from '@prisma/client';
import { randomInt } from 'node:crypto';

export class LinkCodeInvalidError extends Error {
  constructor() {
    super('Código de vinculação inválido');
    this.name = 'LinkCodeInvalidError';
  }
}

export class LinkCodeExpiredError extends Error {
  constructor() {
    super('Código de vinculação expirado');
    this.name = 'LinkCodeExpiredError';
  }
}

const TTL_MS = 10 * 60 * 1000;
const IDENTIFIER_PREFIX = 'link:';

function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

/**
 * Gera um código de 6 dígitos para o User do Telegram vincular sua conta web.
 * Substitui qualquer código pendente do mesmo telegramUserId — só pode haver
 * um ativo de cada vez. Válido por 10 minutos.
 */
export async function generateLinkCode(
  prisma: PrismaClient,
  telegramUserId: string,
): Promise<string> {
  const identifier = `${IDENTIFIER_PREFIX}${telegramUserId}`;
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  const token = generateCode();
  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires: new Date(Date.now() + TTL_MS),
    },
  });
  return token;
}

/**
 * Valida o código e vincula o User do Telegram correspondente ao Account NextAuth
 * passado (o Account do usuário logado no dashboard). Consome o token em sucesso
 * ou em expiração. Lança LinkCodeInvalidError para códigos errados, LinkCodeExpiredError
 * para códigos vencidos.
 */
export async function confirmLink(
  prisma: PrismaClient,
  code: string,
  nextAuthAccountId: string,
): Promise<User> {
  const token = await prisma.verificationToken.findUnique({
    where: { token: code },
  });
  if (!token || !token.identifier.startsWith(IDENTIFIER_PREFIX)) {
    throw new LinkCodeInvalidError();
  }
  if (token.expires.getTime() < Date.now()) {
    await prisma.verificationToken.delete({ where: { token: code } });
    throw new LinkCodeExpiredError();
  }

  const telegramUserId = token.identifier.slice(IDENTIFIER_PREFIX.length);
  const updated = await prisma.user.update({
    where: { telegramUserId },
    data: { linkedAccountId: nextAuthAccountId },
  });
  await prisma.verificationToken.delete({ where: { token: code } });
  return updated;
}
