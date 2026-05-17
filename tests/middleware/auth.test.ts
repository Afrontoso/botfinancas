/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { decideAuth } from '../../src/lib/middleware-auth';

describe('decideAuth', () => {
  describe('rotas públicas', () => {
    it.each([
      '/api/auth/callback/google',
      '/api/auth/signin',
      '/api/webhooks/telegram',
      '/api/cron/invoice-due',
      '/api/cron/weekly-summary',
      '/signin',
    ])('passa sem cookie de sessão: %s', (path) => {
      expect(decideAuth(path, false)).toEqual({ kind: 'allow' });
    });
  });

  describe('rotas protegidas sem sessão', () => {
    it.each([
      '/dashboard',
      '/dashboard/link',
      '/transactions',
      '/transactions/123',
      '/categories',
      '/invoices',
      '/api/export/csv',
      '/api/export/pdf',
    ])('redireciona pra /signin: %s', (path) => {
      expect(decideAuth(path, false)).toEqual({ kind: 'redirect', to: '/signin' });
    });
  });

  describe('rotas protegidas com sessão', () => {
    it.each(['/dashboard', '/transactions', '/api/export/csv'])(
      'passa: %s',
      (path) => {
        expect(decideAuth(path, true)).toEqual({ kind: 'allow' });
      },
    );
  });

  it('homepage / não é protegida', () => {
    expect(decideAuth('/', false)).toEqual({ kind: 'allow' });
  });

  it('não confunde /transactionsX com /transactions', () => {
    expect(decideAuth('/transactionsX', false)).toEqual({ kind: 'allow' });
  });
});
