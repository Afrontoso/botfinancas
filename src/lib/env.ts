import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  TEST_DATABASE_URL: z.string().min(1),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1),
  TELEGRAM_ALLOWED_USER_IDS: z.string().min(1),
  OLLAMA_BASE_URL: z.string().url(),
  OLLAMA_TEXT_MODEL: z.string().min(1),
  LOG_LEVEL: z.string().default('info'),
  NODE_ENV: z.string().default('development'),
});

export function parseEnv() {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${result.error.message}`);
  }
  const e = result.data;
  return {
    databaseUrl: e.DATABASE_URL,
    testDatabaseUrl: e.TEST_DATABASE_URL,
    telegramBotToken: e.TELEGRAM_BOT_TOKEN,
    telegramWebhookSecret: e.TELEGRAM_WEBHOOK_SECRET,
    telegramAllowedUserIds: e.TELEGRAM_ALLOWED_USER_IDS.split(',').map((s) => s.trim()).filter(Boolean),
    ollamaBaseUrl: e.OLLAMA_BASE_URL,
    ollamaTextModel: e.OLLAMA_TEXT_MODEL,
    logLevel: e.LOG_LEVEL,
    nodeEnv: e.NODE_ENV,
  };
}

export type Env = ReturnType<typeof parseEnv>;
