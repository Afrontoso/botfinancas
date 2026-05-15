export function validateTelegramSecret(
  request: Request,
): { ok: true } | { ok: false; status: 401 } {
  const envSecret = process.env['TELEGRAM_WEBHOOK_SECRET'] ?? '';
  if (!envSecret) return { ok: false, status: 401 };

  const header = request.headers.get('x-telegram-bot-api-secret-token') ?? '';
  if (header !== envSecret) return { ok: false, status: 401 };

  return { ok: true };
}

export function isUserAllowed(telegramUserId: string): boolean {
  const raw = process.env['TELEGRAM_ALLOWED_USER_IDS'] ?? '';
  if (!raw.trim()) return false;

  const ids = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return ids.includes(telegramUserId);
}
