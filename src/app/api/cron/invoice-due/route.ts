import { prisma } from '../../../../lib/prisma';
import { generateInvoiceDueReminders } from '../../../../jobs/invoice-due-reminder';
import { processDueReminders } from '../../../../financial/reminder-sender';
import { sendMessage } from '../../../../webhook/reply';
import { validateCronSecret } from '../_auth';

export async function POST(request: Request): Promise<Response> {
  if (!validateCronSecret(request)) {
    return new Response('unauthorized', { status: 401 });
  }

  const now = new Date();
  const created = await generateInvoiceDueReminders(prisma, now);
  const result = await processDueReminders(prisma, sendMessage, now);

  return Response.json({
    ok: true,
    createdCount: created.length,
    sent: result.sent,
    failed: result.failed,
    errors: result.errors,
  });
}
