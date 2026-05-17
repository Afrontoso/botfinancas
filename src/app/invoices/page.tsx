import type { ReactElement } from 'react';
import { prisma } from '../../lib/prisma';
import { getCurrentUser } from '../../lib/current-user';
import { InvoicesView } from '../../components/invoices-view';

export default async function InvoicesPage(): Promise<ReactElement> {
  const user = await getCurrentUser();

  const invoices = await prisma.invoice.findMany({
    where: { account: { userId: user.id } },
    orderBy: { dueDate: 'desc' },
    include: { account: { select: { id: true, name: true } } },
  });

  return <InvoicesView invoices={invoices} />;
}
