# Parte A — Infraestrutura, Webhook do Telegram e Persistência

> **Pré-requisito:** ler `00-contratos-compartilhados.md` antes de começar. Schema Prisma, contrato `processMessage` e fixtures **já devem existir** no repo.

---

## 1. Objetivo

Construir a camada de entrada do sistema:

1. Servidor Next.js com webhook seguro do Telegram.
2. Persistência de toda mensagem recebida em `MessageLog`.
3. Delegação ao `processMessage` (contrato compartilhado) e devolução da resposta no Telegram.
4. Endpoint de saúde e logs estruturados.

**Entregável funcional:** um servidor que, com Tailscale/Cloudflare na frente e webhook configurado no Telegram, recebe mensagens, persiste no banco, chama o processador (stub no início) e responde ao usuário.

---

## 2. Escopo

### Dentro
- Bootstrap Next.js 14+ (App Router) com TypeScript strict.
- `prisma/schema.prisma` (já criado no Sprint 0) e migrations versionadas.
- `POST /api/webhooks/telegram` com validação de `secret_token` e allowlist de usuários.
- `GET /api/health`.
- Persistência de `MessageLog`.
- Cliente HTTP do Telegram (apenas `sendMessage`).
- Logger estruturado (`pino`).
- Stub local de `processMessage` para destravar testes antes da Parte B existir.
- Documentação de setup do túnel (Tailscale Funnel **ou** Cloudflare Tunnel — escolher um).
- Testes unitários e de integração.

### Fora (não fazer)
- Qualquer chamada a Ollama, Whisper ou Llava.
- Lógica de extração de transações.
- Áudio, imagem, documentos (vão pra Fase 3).
- Dashboard (Fase 4).
- Autenticação de dashboard.
- Confirmação interativa via botões inline (vai junto com Parte B).

---

## 3. Stack específica

- `next@14`
- `@prisma/client`, `prisma` (dev)
- `zod` (validação do payload do Telegram)
- `pino`, `pino-pretty` (dev)
- `vitest`, `@vitest/ui` (dev)
- `supertest` ou helpers nativos do Next para testar a rota

---

## 4. Estrutura de arquivos a criar

```
src/
├── app/
│   └── api/
│       ├── webhooks/
│       │   └── telegram/
│       │       └── route.ts
│       └── health/
│           └── route.ts
├── webhook/
│   ├── auth.ts                ← validação de secret + allowlist
│   ├── telegram-payload.ts    ← schemas Zod do payload
│   ├── normalize.ts           ← extrai messageType, normalizedText, ids
│   └── reply.ts               ← cliente sendMessage do Telegram
├── lib/
│   ├── prisma.ts              ← singleton do PrismaClient
│   ├── logger.ts
│   └── env.ts                 ← validação Zod das env vars
└── processor/
    └── stub.ts                ← stub do MessageProcessor até Parte B chegar
tests/
├── setup.ts                   ← do contrato compartilhado, seção 7
├── webhook/
│   ├── auth.test.ts
│   ├── normalize.test.ts
│   └── route.test.ts
└── integration/
    └── webhook-end-to-end.test.ts
```

---

## 5. Stub de `processMessage` (até Parte B chegar)

`src/processor/stub.ts`:

```ts
import type { MessageProcessor, ProcessInput, ProcessResult } from '../../shared/contract';

export const stubProcessor: MessageProcessor = {
  async processMessage(_input: ProcessInput): Promise<ProcessResult> {
    return {
      kind: 'query_answered',
      reply: 'Mensagem recebida. Processamento por IA ainda não está ativo.',
    };
  },
};
```

A rota importa `stubProcessor` por enquanto. No Sprint 3 (integração), troca-se por:

```ts
import { realProcessor } from '../../ai/processor'; // implementação da Parte B
```

A troca deve ser **uma única linha**.

---

## 6. Ordem TDD recomendada

1. Bootstrap mínimo: `next` rodando, `health` retornando 200. (sem TDD)
2. Validação de env vars com Zod. (TDD)
3. `auth.ts` — validação de secret token. (TDD)
4. `telegram-payload.ts` — schema Zod do update do Telegram. (TDD)
5. `normalize.ts` — extração de campos. (TDD)
6. `reply.ts` — cliente Telegram (com `fetch` mockado). (TDD)
7. `route.ts` — orquestração end-to-end. (TDD com banco real de teste)
8. Integração com `stubProcessor` e teste de smoke. (TDD)

---

## 7. Lista de testes

### `tests/webhook/auth.test.ts`

```ts
describe('validateTelegramSecret', () => {
  it('returns ok when secret header matches env value');
  it('returns 401 when secret header is missing');
  it('returns 401 when secret header is wrong');
  it('returns 401 when env secret is empty (fail closed)');
});

describe('isUserAllowed', () => {
  it('returns true when telegramUserId is in allowlist');
  it('returns false when telegramUserId is not in allowlist');
  it('returns false when allowlist is empty (fail closed)');
  it('parses allowlist from comma-separated env var');
});
```

### `tests/webhook/normalize.test.ts`

```ts
describe('normalizeTelegramUpdate', () => {
  it('extracts text message into messageType=text and normalizedText');
  it('detects voice message and sets messageType=audio');
  it('detects photo and sets messageType=image');
  it('detects document and sets messageType=document');
  it('returns messageType=unknown for unsupported types');
  it('extracts chatId and telegramMessageId as strings');
  it('trims whitespace from text');
  it('preserves the raw payload untouched in result.rawPayload');
});
```

### `tests/webhook/route.test.ts`

> Estes testes usam o banco de teste real (ver `tests/setup.ts` no doc de contratos).

```ts
describe('POST /api/webhooks/telegram', () => {
  it('returns 401 when x-telegram-bot-api-secret-token is missing');
  it('returns 401 when secret token is wrong');
  it('returns 200 and persists MessageLog when secret is valid');
  it('creates a User on first message from a new telegramUserId in allowlist');
  it('does not create User and returns 200 (silently ignored) when sender is not in allowlist');
  it('uses existing User on subsequent messages');
  it('persists rawPayload as JSON');
  it('persists normalizedText for text messages');
  it('persists messageType correctly for each kind of update');
  it('calls processMessage with the persisted MessageLog id');
  it('sends the processMessage reply back via Telegram API (mocked fetch)');
  it('returns 200 even when processMessage returns kind=error (so Telegram does not retry)');
  it('returns 200 even when processMessage throws (logs the error)');
  it('is idempotent: same telegramMessageId+chatId twice does not duplicate MessageLog');
});
```

> A idempotência é garantida pelo `@@unique([chatId, telegramMessageId])` do schema. O teste verifica que o segundo POST retorna 200 mas não cria registro duplicado.

### `tests/integration/webhook-end-to-end.test.ts`

```ts
describe('webhook end-to-end with stubProcessor', () => {
  it('a text message round-trips: webhook → MessageLog → reply sent');
  it('logs include the userId and messageLogId for traceability');
});
```

---

## 8. Regras de implementação não-óbvias

- **Sempre 200 para o Telegram em casos esperados.** O Telegram só repete o webhook em caso de erro 5xx ou timeout. Use 401 apenas para falha de autenticação (sem secret/secret errado). Mensagens de usuários não autorizados retornam 200 e são silenciosamente ignoradas (não sinaliza ao atacante que ele acertou o secret).
- **Persistir `MessageLog` antes** de chamar `processMessage`. Se o processamento falhar, a mensagem fica no banco para reprocessamento manual.
- **Singleton do PrismaClient** em `src/lib/prisma.ts` — evita múltiplas conexões em hot reload do Next.
- **Validação de env com Zod** que falha no boot. Nenhuma rota deve rodar com config inválida.
- **Logger nunca loga `rawPayload` completo no nível `info`** — pode conter PII. `debug` ok em desenvolvimento.
- **Mock do `fetch` global** com `vi.spyOn(globalThis, 'fetch')` para testes do `reply.ts`. Não use MSW na Parte A — overkill aqui.

---

## 9. Critérios de aceite

- [ ] `pnpm dev` sobe o servidor e `/api/health` responde 200.
- [ ] `pnpm prisma migrate deploy` aplica migrations sem erro.
- [ ] `pnpm test` passa com 100% dos testes da lista acima verdes.
- [ ] Webhook real do Telegram (configurado via `setWebhook` com `secret_token`) entrega uma mensagem e o stub responde "Mensagem recebida...".
- [ ] `MessageLog` aparece no banco após mensagem real.
- [ ] Tentativa de POST sem header de secret retorna 401.
- [ ] `README.md` da Parte A documenta: como subir Postgres local, como rodar migrations, como criar bot no BotFather, como configurar túnel, como setar webhook com secret.
- [ ] `.env.example` está commitado e completo.
- [ ] Logs em produção (`NODE_ENV=production`) não contêm tokens nem payloads sensíveis.

---

## 10. Anti-objetivos (não fazer)

- Não implementar lógica de IA — isso é Parte B.
- Não importar nada de `src/ai/` (não existe ainda).
- Não criar tabelas além das definidas no schema compartilhado.
- Não adicionar autenticação de dashboard.
- Não configurar deploy em produção remota — projeto roda local no MacBook.
