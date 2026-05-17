import { prisma } from '../../../../lib/prisma';
import { generateWeeklySummaryReminders } from '../../../../jobs/weekly-summary';
import { processDueReminders } from '../../../../financial/reminder-sender';
import { sendMessage } from '../../../../webhook/reply';
import { validateCronSecret } from '../_auth';

export async function POST(request: Request): Promise<Response> {
  if (!validateCronSecret(request)) {
    return new Response('unauthorized', { status: 401 });
  }

  const now = new Date();
  const created = await generateWeeklySummaryReminders(prisma, now);
  const result = await processDueReminders(prisma, sendMessage, now);

  return Response.json({
    ok: true,
    createdCount: created.length,
    sent: result.sent,
    failed: result.failed,
    errors: result.errors,
  });
}
