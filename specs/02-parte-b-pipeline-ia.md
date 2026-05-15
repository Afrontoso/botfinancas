# Parte B — Pipeline de IA, Sanitização e Serviço Financeiro

> **Pré-requisito:** ler `00-contratos-compartilhados.md` antes de começar. Schema Prisma, contrato `processMessage` e fixtures **já devem existir** no repo.

---

## 1. Objetivo

Implementar a inteligência do sistema:

1. Cliente Ollama com interface injetável.
2. Loader de prompts versionados.
3. Extração robusta de JSON de respostas de LLM.
4. Validação Zod e regras de confiança.
5. Serviço financeiro (cria/consulta transações via Prisma).
6. Função `processMessage` do contrato compartilhado.

**Entregável funcional:** módulo standalone `src/ai/processor.ts` exporta uma implementação de `MessageProcessor` (do `shared/contract.ts`) com **100% dos testes verdes** e cobertura completa das fixtures compartilhadas.

---

## 2. Escopo

### Dentro
- `LlmClient` com interface + implementação Ollama HTTP + `FakeLlmClient` para testes.
- Loader de prompts em `prompts/*.md`.
- `extractJson` (regex + parse).
- Schemas Zod para a saída do LLM.
- Camada de sanitização e regras de confiança.
- `FinancialService` com Prisma: criar transação, resolver/criar categoria, listar transações por período.
- Resolver de datas relativas ("ontem", "hoje", "essa semana").
- Detecção básica de intenção: `create_transaction` vs `query`.
- Persistência de `AiInference` em toda chamada ao LLM.
- Implementação real de `processMessage` exposta em `src/ai/processor.ts`.

### Fora (não fazer)
- Qualquer coisa de HTTP, Next.js, Telegram. Esta parte **não importa nada de `src/webhook/` nem do `next`**.
- Áudio (Whisper) e imagem (Llava).
- `MemoryEntry` além do mínimo (apenas estrutura, sem busca semântica).
- Streaming de respostas do LLM.
- Confirmação interativa (inline keyboards) — apenas retorna `kind: needs_confirmation` no contrato.

---

## 3. Stack específica

- `@prisma/client` (gerado pela Parte A)
- `zod`
- `ollama` (cliente oficial JS) **ou** `fetch` direto contra `OLLAMA_BASE_URL` — escolha do implementador, justifique no README.
- `date-fns` e `date-fns-tz` para parsing/timezone (User.timezone).
- `vitest`

---

## 4. Estrutura de arquivos a criar

```
prompts/
└── transaction-extraction.v1.md
src/
├── ai/
│   ├── llm-client.ts          ← interface LlmClient + OllamaLlmClient
│   ├── fake-llm-client.ts     ← para testes
│   ├── prompt-loader.ts
│   ├── extract-json.ts
│   ├── schemas.ts             ← Zod schemas da saída do LLM
│   ├── sanitize.ts            ← orquestra extract + validate + regras
│   ├── confidence.ts          ← regras de threshold
│   ├── intent.ts              ← detecta create_transaction vs query
│   └── processor.ts           ← exporta MessageProcessor (entry point)
├── financial/
│   ├── service.ts             ← createTransaction, listByPeriod, etc.
│   ├── categories.ts          ← findOrCreate
│   └── dates.ts               ← resolveDateExpression
└── lib/
    ├── prisma.ts              ← reutilizar singleton (combinar com Parte A)
    └── logger.ts              ← reutilizar
tests/
└── ai/
    ├── extract-json.test.ts
    ├── schemas.test.ts
    ├── sanitize.test.ts
    ├── confidence.test.ts
    ├── intent.test.ts
    ├── prompt-loader.test.ts
    ├── financial/
    │   ├── service.test.ts
    │   ├── categories.test.ts
    │   └── dates.test.ts
    └── processor.test.ts      ← end-to-end com FakeLlmClient + DB real
```

---

## 5. Interface `LlmClient`

```ts
// src/ai/llm-client.ts

export interface LlmCompletionRequest {
  model: string;
  prompt: string;
  temperature?: number;
}

export interface LlmCompletionResponse {
  rawText: string;
  model: string;
  latencyMs: number;
}

export interface LlmClient {
  complete(req: LlmCompletionRequest): Promise<LlmCompletionResponse>;
}
```

Em produção: `OllamaLlmClient` faz POST em `{OLLAMA_BASE_URL}/api/generate`.

Em testes: `FakeLlmClient` segue estratégia **FIFO** — recebe no construtor um `string[]` de respostas e devolve uma por chamada, em ordem. Vazio = lança erro. Esta escolha (em vez de matching por substring) é deliberada: testes ficam determinísticos e independentes do conteúdo do prompt.

```ts
// Exemplo de uso em teste
import expenseSimple from '../../shared/fixtures/expense_simple.json' with { type: 'json' };
import incomeSalary from '../../shared/fixtures/income_salary.json' with { type: 'json' };

const fake = new FakeLlmClient([
  expenseSimple.llmRawResponse,
  incomeSalary.llmRawResponse,
]);
const result1 = await processor.processMessage({ text: 'Gastei 50', ... }); // consome 1ª
const result2 = await processor.processMessage({ text: 'Recebi 3000', ... }); // consome 2ª
```

---

## 6. Schema Zod da saída do LLM

```ts
// src/ai/schemas.ts
import { z } from 'zod';

export const LlmTransactionSchema = z.object({
  intent: z.literal('create_transaction'),
  type: z.enum(['expense', 'income', 'transfer', 'adjustment']),
  amount: z.number().positive(),
  currency: z.string().default('BRL'),
  description: z.string().min(1),
  category: z.string().optional(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMethod: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1),
});

export const LlmQuerySchema = z.object({
  intent: z.literal('query'),
  queryType: z.enum(['balance', 'expense_by_category', 'recent_transactions', 'unknown']),
  period: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).optional(),
  category: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export const LlmOutputSchema = z.discriminatedUnion('intent', [
  LlmTransactionSchema,
  LlmQuerySchema,
]);

export type LlmTransaction = z.infer<typeof LlmTransactionSchema>;
export type LlmQuery = z.infer<typeof LlmQuerySchema>;
export type LlmOutput = z.infer<typeof LlmOutputSchema>;
```

> **Escopo desta versão:** os schemas acima cobrem apenas as 9 fixtures do MVP (S-1 a S-3) — `create_transaction` simples (despesa/receita) e `query` básico. As intenções listadas no `specs/00` §3 que **não** estão cobertas aqui — `record_transfer`, `record_invoice_payment`, `record_split_creation`, `record_split_settlement`, `record_split_absorb`, `record_yield`, `vault_create`, `confirm_recurring`, `query_invoice`, `query_budget` — exigirão **novos membros** no `LlmOutputSchema` à medida que as sprints S-4 a S-8 forem abertas. Cada nova sprint deve começar com uma task dedicada à expansão do `discriminatedUnion`, antes de qualquer task de comportamento. Não tentar especificá-los hoje — só serão desenhados quando o prompt correspondente for escrito.

---

## 7. Regras de confiança

```
confidence >= 0.85   → status=confirmed,            kind=transaction_created
0.60 <= conf < 0.85  → status=pending_confirmation, kind=needs_confirmation
confidence < 0.60    → status=rejected,             kind=error (reply pede para reformular)
```

Esses thresholds ficam em `src/ai/confidence.ts` como constantes nomeadas, não literais espalhados.

---

## 8. Ordem TDD recomendada

1. `extractJson` — função pura, casos da seção 12.3 do roadmap. (TDD)
2. `schemas.ts` — Zod schemas. (TDD com inputs válidos/inválidos)
3. `sanitize.ts` — combina os dois acima. (TDD)
4. `confidence.ts` — regras puras. (TDD)
5. `dates.ts` — resolveDateExpression. (TDD)
6. `categories.ts` — findOrCreate com banco real de teste. (TDD)
7. `service.ts` — createTransaction. (TDD com banco real)
8. `intent.ts` — heurística simples (regex/keywords) ou LLM separado para classificar. (TDD)
9. `prompt-loader.ts` — carrega arquivo, substitui placeholders. (TDD)
10. `llm-client.ts` — `OllamaLlmClient` com `fetch` mockado, `FakeLlmClient` puro. (TDD)
11. `processor.ts` — orquestração end-to-end com `FakeLlmClient` e DB real. (TDD com fixtures compartilhadas)

---

## 9. Lista de testes

### `tests/ai/extract-json.test.ts`

```ts
describe('extractJson', () => {
  it('returns parsed object for clean JSON string');
  it('extracts JSON when wrapped in markdown code fence ```json ... ```');
  it('extracts JSON when wrapped in markdown code fence without language tag');
  it('extracts JSON when preceded by explanatory text');
  it('extracts JSON when followed by explanatory text');
  it('extracts JSON when surrounded by both prefix and suffix');
  it('returns the first JSON object when multiple are present');
  it('throws ParseError when no JSON-like substring is found');
  it('throws ParseError when JSON-like substring is malformed (unbalanced braces)');
  it('handles nested objects correctly');
  it('handles arrays inside the object');
});
```

### `tests/ai/schemas.test.ts`

```ts
describe('LlmTransactionSchema', () => {
  it('validates a complete expense object');
  it('validates an income object');
  it('rejects amount <= 0');
  it('rejects unknown type values');
  it('rejects malformed date (DD/MM/YYYY)');
  it('rejects confidence > 1');
  it('rejects confidence < 0');
  it('defaults currency to BRL when omitted');
  it('accepts paymentMethod as null');
  it('accepts paymentMethod omitted');
  it('rejects empty description');
});

describe('LlmQuerySchema', () => {
  it('validates a balance query');
  it('validates a query with period');
  it('rejects unknown queryType');
});

describe('LlmOutputSchema (discriminated union)', () => {
  it('routes to transaction schema when intent=create_transaction');
  it('routes to query schema when intent=query');
  it('rejects unknown intent');
});
```

### `tests/ai/sanitize.test.ts`

```ts
describe('sanitizeLlmOutput', () => {
  it('returns success for clean valid JSON');
  it('returns parse_error for unparseable text');
  it('returns validation_error for valid JSON that fails schema');
  it('returns success for JSON wrapped in markdown');
  it('returns success for JSON with prefix/suffix text');
  it('exposes the parsed object in the success result');
  it('exposes the raw error message in failure results');
});
```

### `tests/ai/confidence.test.ts`

```ts
describe('classifyConfidence', () => {
  it('returns "high" for confidence >= 0.85');
  it('returns "medium" for 0.60 <= confidence < 0.85');
  it('returns "low" for confidence < 0.60');
  it('handles boundary 0.85 as high');
  it('handles boundary 0.60 as medium');
  it('handles 0 as low');
  it('handles 1 as high');
});
```

### `tests/ai/intent.test.ts`

```ts
describe('detectIntent', () => {
  it('classifies "Gastei 50 no mercado" as create_transaction');
  it('classifies "Recebi 3000" as create_transaction');
  it('classifies "Quanto gastei hoje?" as query');
  it('classifies "Me mostra meus gastos" as query');
  it('classifies ambiguous text as create_transaction (default)');
});
```

### `tests/ai/prompt-loader.test.ts`

```ts
describe('loadPrompt', () => {
  it('loads transaction-extraction.v1.md');
  it('substitutes {{message}} placeholder');
  it('substitutes {{currentDate}} placeholder');
  it('substitutes {{context}} placeholder with empty string when not provided');
  it('throws when prompt file does not exist');
  it('returns the prompt version string');
});
```

### `tests/ai/financial/dates.test.ts`

```ts
describe('resolveDateExpression', () => {
  // Reference date: 2026-05-09 (sábado), timezone America/Sao_Paulo
  it('resolves "hoje" to current date');
  it('resolves "ontem" to date - 1 day');
  it('resolves "anteontem" to date - 2 days');
  it('resolves "amanhã" to date + 1 day');
  it('resolves "essa semana" to range Mon-Sun of current week');
  it('resolves "esse mês" to range first-last day of current month');
  it('resolves explicit "2026-04-15" as itself');
  it('resolves "15/04" using current year');
  it('respects user timezone when computing "hoje"');
  it('returns null for unrecognized expressions');
});
```

### `tests/ai/financial/categories.test.ts`

```ts
describe('findOrCreateCategory', () => {
  it('creates a new category when name does not exist for user');
  it('returns existing category by case-insensitive name match');
  it('does not return categories from other users');
  it('uses correct CategoryType based on transaction type');
  it('normalizes whitespace and capitalizes name on create');
});
```

### `tests/ai/financial/service.test.ts`

```ts
describe('FinancialService.createTransaction', () => {
  it('persists a transaction with all fields');
  it('persists with status=confirmed when confidence is high');
  it('persists with status=pending_confirmation when confidence is medium');
  it('links the transaction to the resolved category');
  it('uses user default currency when input currency is omitted');
  it('rejects amount <= 0');
  it('returns the created transaction id');
});

describe('FinancialService.queryBalance', () => {
  it('returns sum of expenses in the requested period');
  it('returns 0 for a period with no transactions');
  it('respects user scope (does not aggregate other users)');
  it('excludes transactions with status=rejected');
});
```

### `tests/ai/processor.test.ts`

> Este é o teste de fechamento. Roda com `FakeLlmClient` carregado a partir das fixtures de `shared/fixtures/`, e DB de teste real.

```ts
describe('processMessage (real implementation)', () => {
  it('fixture expense_simple → kind=transaction_created, transaction persisted');
  it('fixture income_salary → kind=transaction_created, type=income persisted');
  it('fixture expense_with_card → paymentMethod persisted');
  it('fixture llm_with_markdown → still kind=transaction_created (sanitization works)');
  it('fixture llm_with_prefix → still kind=transaction_created');
  it('fixture llm_low_confidence → kind=needs_confirmation, transaction persisted with status=pending_confirmation');
  it('fixture llm_invalid_json → kind=error, AiInference persisted with status=parse_error');
  it('fixture llm_negative_amount → kind=error, status=validation_error');
  it('fixture query_balance → kind=query_answered, no transaction persisted');

  it('persists AiInference with promptVersion, latency, and parsed output on success');
  it('persists AiInference with status=llm_error and error message when LlmClient throws');
  it('never throws — always returns a ProcessResult');
  it('never sees Prisma — uses injected service (or asserts on real DB state)');
});
```

---

## 10. Regras de implementação não-óbvias

- **`processMessage` nunca lança.** Qualquer erro vira `{ kind: 'error', reason: '...' }`. A Parte A confia nessa garantia para sempre retornar 200 ao Telegram.
- **Toda chamada ao LLM gera um `AiInference`** — sucesso ou falha. Esse log é a única forma de auditar qualidade do modelo depois.
- **Prompts são arquivos versionados.** Nome do arquivo = versão. `transaction-extraction.v1.md` → `promptVersion = "transaction-extraction.v1"`.
- **Use `Decimal` (Prisma) para valores monetários.** Nunca `number`/`float` em fronteira com o banco. Pode receber `number` do LLM e converter antes de persistir.
- **Datas do LLM vêm como string `YYYY-MM-DD`.** Converter para `Date` na timezone do User antes de persistir.
- **Timezone:** sempre `America/Sao_Paulo` por padrão (ou o que estiver em `User.timezone`). Nunca usar `new Date()` direto para "hoje" — sempre passar pelo `resolveDateExpression` com timezone explícita.
- **Categoria é por usuário.** `findOrCreateCategory` sempre filtra por `userId`. Constraint `@@unique([userId, name])` no schema.
- **Não confie no `confidence` do LLM cegamente.** Aplique também heurística mínima: se `description` é vazia ou genérica ("algo", "compra"), rebaixe a confiança em 0.2.
- **Injeção de dependência:** `processor.ts` recebe `LlmClient` e `FinancialService` por construtor/factory. Facilita teste e troca futura.
- **`Transaction.direction` é exclusivo de transferências.** `FinancialService.createTransaction` deve setar `direction=null` para `expense`, `income` e `adjustment`, e setar explicitamente `out`/`in` para cada perna de `transfer`. Nunca confiar em default — o schema agora é nullable, sem default (ver `specs/00` §2).
- **Atualização de `Invoice.totalAmount` é atômica.** Toda criação de `Transaction` com `invoiceId` (compra no cartão) deve ocorrer dentro de uma `prisma.$transaction([...])` que também faz `prisma.invoice.update({ totalAmount: { increment: amount } })`. Se a transação for rejeitada depois (`status` muda para `rejected`), decrementar simetricamente. Caso contrário, `totalAmount` ficará dessincronizado com a soma real das compras e a comparação `paidAmount >= totalAmount` usada para inferir `status=paid` produzirá resultados errados silenciosamente.
- **Atualização de `Invoice.paidAmount` é atômica.** Toda criação de `InvoicePayment` deve ocorrer dentro de uma `prisma.$transaction([...])` que também faz `prisma.invoice.update({ paidAmount: { increment: amount }, status: novoStatus })`. Caso contrário, `paidAmount` fica dessincronizado com a soma dos `InvoicePayment`. O cálculo de novo `status` (`paid` se `paidAmount >= totalAmount`, `partial` se `> 0`, `closed` se `0`) entra na mesma transaction.

---

## 11. Critérios de aceite

- [ ] `pnpm test tests/ai/**` passa com 100% dos testes da lista acima verdes.
- [ ] Todas as 9 fixtures compartilhadas têm teste verde em `processor.test.ts`.
- [ ] Cobertura mínima 85% nos arquivos de `src/ai/` e `src/financial/`.
- [ ] `src/ai/processor.ts` exporta `realProcessor: MessageProcessor` pronto para a Parte A importar.
- [ ] `prompts/transaction-extraction.v1.md` existe e segue a estrutura da seção 13.2 do roadmap.
- [ ] `OllamaLlmClient` tem teste de integração opcional (skip por padrão, roda só com `RUN_OLLAMA_TESTS=true`) que faz uma chamada real e valida que parseia.
- [ ] README da Parte B documenta: como rodar Ollama local, como baixar modelo, como rodar suite de teste, como recapturar fixtures (script `pnpm capture-fixtures`).

---

## 12. Anti-objetivos (não fazer)

- Não tocar em `src/webhook/`, `src/app/`, nada de Next.js.
- Não modificar `prisma/schema.prisma` sem alinhamento com a Parte A.
- Não modificar `shared/contract.ts` ou `shared/fixtures/`.
- Não chamar Ollama em testes do CI — apenas via `FakeLlmClient`.
- Não implementar Whisper/Llava (Fase 3).
- Não criar dashboard nem API REST de leitura — `FinancialService` é consumido só internamente nesta fase.
- Não implementar memória semântica (embeddings) — só estrutura crua de `MemoryEntry`.
