import { prisma } from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/current-user';
import { listTransactionsForExport } from '../../../../financial/queries';
import { transactionsToPdf } from '../../../../financial/export-pdf';
import { parseExportFilter } from '../_filter';

export async function GET(request: Request): Promise<Response> {
  const user = await getCurrentUser();
  const url = new URL(request.url);
  const filter = parseExportFilter(url.searchParams);
  const transactions = await listTransactionsForExport(prisma, user.id, filter);
  const pdf = await transactionsToPdf(transactions);

  const filename = `transactions-${new Date().toISOString().slice(0, 10)}.pdf`;
  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
