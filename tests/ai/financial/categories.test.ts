/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../../../tests/setup';
import { findOrCreateCategory } from '../../../src/financial/categories';

describe('findOrCreateCategory', () => {
  let testUser: { id: string };

  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: { telegramUserId: '999000999', name: 'Test User' },
    });
  });

  it('creates a new category when name does not exist for user', async () => {
    const category = await findOrCreateCategory(prisma, testUser.id, 'Mercado', 'expense');

    expect(category).toMatchObject({
      userId: testUser.id,
      name: 'Mercado',
      type: 'expense',
    });
    expect(category.id).toBeDefined();
  });

  it('returns existing category by case-insensitive name match', async () => {
    const created = await findOrCreateCategory(prisma, testUser.id, 'Mercado', 'expense');
    const found = await findOrCreateCategory(prisma, testUser.id, 'MERCADO', 'expense');

    expect(found.id).toBe(created.id);
    expect(found.name).toBe('Mercado');
  });

  it('does not return categories from other users (scoped by userId)', async () => {
    const otherUser = await prisma.user.create({
      data: { telegramUserId: '111222333', name: 'Other User' },
    });

    await findOrCreateCategory(prisma, otherUser.id, 'Mercado', 'expense');
    const category = await findOrCreateCategory(prisma, testUser.id, 'Mercado', 'expense');

    expect(category.userId).toBe(testUser.id);
    // Both are distinct records
    const allCategories = await prisma.category.findMany({ where: { name: 'Mercado' } });
    expect(allCategories).toHaveLength(2);
  });

  it('uses correct CategoryType based on transaction type', async () => {
    const expenseCategory = await findOrCreateCategory(prisma, testUser.id, 'Salário', 'income');
    expect(expenseCategory.type).toBe('income');

    const otherUser = await prisma.user.create({
      data: { telegramUserId: '444555666', name: 'Another User' },
    });
    const incomeCategory = await findOrCreateCategory(prisma, otherUser.id, 'Supermercado', 'expense');
    expect(incomeCategory.type).toBe('expense');
  });

  it('normalizes whitespace and capitalizes name on create', async () => {
    const category = await findOrCreateCategory(prisma, testUser.id, '  mercado  ', 'expense');

    expect(category.name).toBe('Mercado');
  });
});
