/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { prisma } from '../setup';
import {
  generateLinkCode,
  confirmLink,
  LinkCodeExpiredError,
  LinkCodeInvalidError,
} from '../../src/financial/link-account';

describe('link-account', () => {
  let telegramUserId: string;
  let financialUserId: string;
  let webUserId: string;
  let nextAuthAccountId: string;

  beforeEach(async () => {
    // User do Telegram (com transações etc)
    const telegramUser = await prisma.user.create({
      data: { telegramUserId: '111222', name: 'Tele User' },
    });
    telegramUserId = telegramUser.telegramUserId;
    financialUserId = telegramUser.id;

    // User criado pelo NextAuth no primeiro login Google
    const webUser = await prisma.user.create({
      data: { telegramUserId: 'web-stub-333', name: 'Google User', email: 'g@gmail.com' },
    });
    webUserId = webUser.id;
    const acc = await prisma.account.create({
      data: {
        userId: webUserId,
        type: 'oauth',
        provider: 'google',
        providerAccountId: 'g-12345',
      },
    });
    nextAuthAccountId = acc.id;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('generateLinkCode', () => {
    it('gera código de 6 dígitos e armazena com expiração de 10min', async () => {
      const code = await generateLinkCode(prisma, telegramUserId);
      expect(code).toMatch(/^\d{6}$/);

      const tokens = await prisma.verificationToken.findMany();
      expect(tokens).toHaveLength(1);
      expect(tokens[0]?.identifier).toBe(`link:${telegramUserId}`);
      const ttl = tokens[0]!.expires.getTime() - Date.now();
      expect(ttl).toBeGreaterThan(9 * 60 * 1000);
      expect(ttl).toBeLessThanOrEqual(10 * 60 * 1000 + 100);
    });

    it('substitui código anterior do mesmo telegramUserId', async () => {
      await generateLinkCode(prisma, telegramUserId);
      const second = await generateLinkCode(prisma, telegramUserId);
      const tokens = await prisma.verificationToken.findMany({
        where: { identifier: `link:${telegramUserId}` },
      });
      expect(tokens).toHaveLength(1);
      expect(tokens[0]?.token).toBe(second);
    });
  });

  describe('confirmLink', () => {
    it('seta linkedAccountId no User do Telegram em caso de sucesso', async () => {
      const code = await generateLinkCode(prisma, telegramUserId);
      const linked = await confirmLink(prisma, code, nextAuthAccountId);
      expect(linked.id).toBe(financialUserId);
      expect(linked.linkedAccountId).toBe(nextAuthAccountId);
    });

    it('consome o código após uso (não permite reuso)', async () => {
      const code = await generateLinkCode(prisma, telegramUserId);
      await confirmLink(prisma, code, nextAuthAccountId);
      const tokens = await prisma.verificationToken.findMany();
      expect(tokens).toHaveLength(0);
      await expect(confirmLink(prisma, code, nextAuthAccountId)).rejects.toBeInstanceOf(
        LinkCodeInvalidError,
      );
    });

    it('rejeita código inválido', async () => {
      await generateLinkCode(prisma, telegramUserId);
      await expect(confirmLink(prisma, '000000', nextAuthAccountId)).rejects.toBeInstanceOf(
        LinkCodeInvalidError,
      );
    });

    it('rejeita código expirado e remove o token', async () => {
      const code = await generateLinkCode(prisma, telegramUserId);
      // expira manualmente pra evitar fake timers + DB
      await prisma.verificationToken.updateMany({
        where: { token: code },
        data: { expires: new Date(Date.now() - 1000) },
      });
      await expect(confirmLink(prisma, code, nextAuthAccountId)).rejects.toBeInstanceOf(
        LinkCodeExpiredError,
      );
      const tokens = await prisma.verificationToken.findMany();
      expect(tokens).toHaveLength(0);
    });
  });
});
