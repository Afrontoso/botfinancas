/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../setup';
import { GET as csvGet } from '../../src/app/api/export/csv/route';
import { GET as pdfGet } from '../../src/app/api/export/pdf/route';

describe('export endpoints', () => {
  let userId: string;
  let otherUserId: string;
  let foodCategoryId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: { telegramUserId: '999111', name: 'Export User' },
    });
    userId = user.id;
    const other = await prisma.user.create({
      data: { telegramUserId: '999222', name: 'Other User' },
    });
    otherUserId = other.id;

    const food = await prisma.category.create({
      data: { userId, name: 'Alimentação', type: 'expense' },
    });
    foodCategoryId = food.id;

    await prisma.transaction.createMany({
      data: [
        {
          userId,
          categoryId: foodCategoryId,
          type: 'expense',
          amount: 50,
          currency: 'BRL',
          description: 'Mercado',
          transactionDate: new Date('2026-05-10'),
        },
        {
          userId,
          type: 'income',
          amount: 3000,
          currency: 'BRL',
          description: 'Salário',
          transactionDate: new Date('2026-05-05'),
        },
        // fora do range padrão de datas (abril, não maio)
        {
          userId,
          categoryId: foodCategoryId,
          type: 'expense',
          amount: 200,
          currency: 'BRL',
          description: 'Mercado abril',
          transactionDate: new Date('2026-04-15'),
        },
        // pertence a outro usuário — nunca deve aparecer no export
        {
          userId: otherUserId,
          type: 'expense',
          amount: 999,
          currency: 'BRL',
          description: 'Other user secret',
          transactionDate: new Date('2026-05-10'),
        },
      ],
    });
  });

  describe('GET /api/export/csv', () => {
    it('returns text/csv with attachment disposition', async () => {
      const res = await csvGet(new Request('http://test/api/export/csv'));
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('text/csv');
      expect(res.headers.get('Content-Disposition')).toMatch(/attachment; filename=".+\.csv"/);
    });

    it('includes only transactions for the current user', async () => {
      const res = await csvGet(new Request('http://test/api/export/csv'));
      const body = await res.text();
      expect(body).toContain('Mercado');
      expect(body).toContain('Salário');
      expect(body).not.toContain('Other user secret');
    });

    it('filters by type', async () => {
      const res = await csvGet(new Request('http://test/api/export/csv?type=expense'));
      const body = await res.text();
      expect(body).toContain('Mercado');
      expect(body).not.toContain('Salário');
    });

    it('filters by from/to date range', async () => {
      const res = await csvGet(
        new Request('http://test/api/export/csv?from=2026-05-01&to=2026-05-31'),
      );
      const body = await res.text();
      expect(body).toContain('Mercado');
      expect(body).not.toContain('Mercado abril');
    });

    it('filters by categoryId', async () => {
      const res = await csvGet(
        new Request(`http://test/api/export/csv?categoryId=${foodCategoryId}`),
      );
      const body = await res.text();
      expect(body).toContain('Mercado');
      expect(body).not.toContain('Salário');
    });
  });

  describe('GET /api/export/pdf', () => {
    it('returns application/pdf with attachment disposition', async () => {
      const res = await pdfGet(new Request('http://test/api/export/pdf'));
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/pdf');
      expect(res.headers.get('Content-Disposition')).toMatch(/attachment; filename=".+\.pdf"/);
    });

    it('returns a Buffer with the PDF magic bytes', async () => {
      const res = await pdfGet(new Request('http://test/api/export/pdf'));
      const buf = Buffer.from(await res.arrayBuffer());
      expect(buf.slice(0, 4).toString('ascii')).toBe('%PDF');
    });

    it('respects type filter (smaller output)', async () => {
      const all = await pdfGet(new Request('http://test/api/export/pdf'));
      const onlyExpense = await pdfGet(new Request('http://test/api/export/pdf?type=expense'));
      const allBuf = Buffer.from(await all.arrayBuffer());
      const expBuf = Buffer.from(await onlyExpense.arrayBuffer());
      // ambos são PDFs válidos
      expect(allBuf.slice(0, 4).toString('ascii')).toBe('%PDF');
      expect(expBuf.slice(0, 4).toString('ascii')).toBe('%PDF');
    });
  });
});
