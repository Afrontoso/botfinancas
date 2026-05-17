import type { ReactElement } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import { prisma } from '../../lib/prisma';
import { getCurrentUser } from '../../lib/current-user';
import { listByCategory } from '../../financial/queries';
import { CategoriesView } from '../../components/categories-view';

export default async function CategoriesPage(): Promise<ReactElement> {
  const user = await getCurrentUser();
  const now = toZonedTime(new Date(), user.timezone);
  const from = startOfMonth(now);
  const to = endOfMonth(now);

  const [expenses, income] = await Promise.all([
    listByCategory(prisma, user.id, 'expense', from, to),
    listByCategory(prisma, user.id, 'income', from, to),
  ]);

  const periodLabel = `Período: ${format(from, 'MMM/yyyy', { locale: ptBR })}`;

  return <CategoriesView periodLabel={periodLabel} expenses={expenses} income={income} />;
}
