import { prisma } from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/current-user';
import { listTransactionsForExport } from '../../../../financial/queries';
import { transactionsToCsv } from '../../../../financial/export-csv';
import { parseExportFilter } from '../_filter';

export async function GET(request: Request): Promise<Response> {
  const user = await getCurrentUser();
  const url = new URL(request.url);
  const filter = parseExportFilter(url.searchParams);
  const transactions = await listTransactionsForExport(prisma, user.id, filter);
  const csv = transactionsToCsv(transactions);

  const filename = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
