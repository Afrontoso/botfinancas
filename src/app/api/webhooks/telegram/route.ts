import { prisma } from '../../../../lib/prisma';
import { logger } from '../../../../lib/logger';
import { validateTelegramSecret, isUserAllowed } from '../../../../webhook/auth';
import { TelegramUpdateSchema } from '../../../../webhook/telegram-payload';
import { normalizeTelegramUpdate } from '../../../../webhook/normalize';
import { sendMessage } from '../../../../webhook/reply';
import { processMessage } from '../../../../financial/processor';
import { OllamaLlmClient } from '../../../../ai/llm-client';

export async function POST(request: Request): Promise<Response> {
  const authResult = validateTelegramSecret(request);
  if (!authResult.ok) {
    return new Response(null, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response('ok', { status: 200 });
  }

  const parseResult = TelegramUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    return new Response('ok', { status: 200 });
  }

  const update = parseResult.data;
  const message = update.message ?? update.edited_message;
  if (!message || !message.from) {
    return new Response('ok', { status: 200 });
  }

  const fromId = String(message.from.id);

  if (!isUserAllowed(fromId)) {
    return new Response('ok', { status: 200 });
  }

  const name =
    message.from.first_name +
    (message.from.last_name ? ` ${message.from.last_name}` : '');

  const user = await prisma.user.upsert({
    where: { telegramUserId: fromId },
    create: { telegramUserId: fromId, name },
    update: {},
  });

  const normalized = normalizeTelegramUpdate(update);

  let messageLog;
  try {
    messageLog = await prisma.messageLog.create({
      data: {
        userId: user.id,
        chatId: normalized.chatId,
        telegramMessageId: normalized.telegramMessageId,
        messageType: normalized.messageType,
        normalizedText: normalized.normalizedText,
        rawPayload: update,
      },
    });
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return new Response('ok', { status: 200 });
    }
    throw err;
  }

  let result: { reply: string };
  try {
    const llm = new OllamaLlmClient(
      process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:11434',
      process.env['OLLAMA_TEXT_MODEL'] ?? 'llama3.1',
    );
    result = await processMessage(normalized.normalizedText ?? '', user.id, llm);
  } catch (err) {
    logger.error({ err, messageLogId: messageLog.id }, 'processMessage threw');
    return new Response('ok', { status: 200 });
  }

  try {
    await sendMessage(normalized.chatId, result.reply);
  } catch (err) {
    logger.error({ err, chatId: normalized.chatId }, 'sendMessage failed');
  }

  return new Response('ok', { status: 200 });
}
