import type { ReactElement } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { prisma } from '../../lib/prisma';
import { getCurrentUser } from '../../lib/current-user';
import { computeBalance, listRecent } from '../../financial/queries';
import { DashboardView } from '../../components/dashboard-view';

export default async function DashboardPage(): Promise<ReactElement> {
  const user = await getCurrentUser();
  const now = toZonedTime(new Date(), user.timezone);
  const [balance, recent] = await Promise.all([
    computeBalance(prisma, user.id, startOfMonth(now), endOfMonth(now)),
    listRecent(prisma, user.id, 5),
  ]);
  return <DashboardView balance={balance} recent={recent} />;
}
