import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  TEST_DATABASE_URL: z.string().min(1),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1),
  TELEGRAM_ALLOWED_USER_IDS: z.string().min(1),
  // LLM: pelo menos um dos dois precisa estar definido em runtime.
  // O selector (escolha em runtime) está em src/ai/llm-client.ts::makeLlmClient.
  OLLAMA_BASE_URL: z.string().url().optional(),
  OLLAMA_TEXT_MODEL: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  LOG_LEVEL: z.string().default('info'),
  NODE_ENV: z.string().default('development'),
  // S-9 (auth web Google). Opcionais aqui — só ficam obrigatórios no runtime
  // do NextAuth (que falha sozinho se faltar).
  AUTH_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // S-11 (crons protegidos). Opcional — só obrigatório nos endpoints /api/cron/*.
  CRON_SECRET: z.string().optional(),
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
