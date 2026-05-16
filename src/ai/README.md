# Parte B — Pipeline de IA

Este diretório contém os módulos da pipeline de processamento de linguagem natural para extração e classificação de transações financeiras.

---

## Fluxo completo

```
Mensagem do usuário
      │
      ▼
 detectIntent()          ← src/ai/intent.ts
      │
      ├── 'query'        → resposta informativa (sem LLM)
      │
      └── 'create_transaction'
              │
              ▼
         loadPrompt()    ← src/ai/prompt-loader.ts
              │
              ▼
         llm.complete()  ← LlmClient (Ollama ou Fake)
              │
              ▼
        parseAiResponse()← src/ai/service.ts
              │  extractJson → sanitize → Zod.parse → calculateConfidence
              │
              ▼
         processMessage()← src/financial/processor.ts
              │  findOrCreateCategory + prisma.transaction.create
              │  (+ prisma.$transaction se invoiceId)
              │
              ▼
          ProcessResult { type, transaction?, reply }
```

---

## Módulos

**`extract-json.ts`** — Extrai o primeiro bloco JSON válido de um texto bruto do LLM. Suporta JSON direto, cercas de código ````json` e busca por chaves balanceadas. Lança `ParseError` se não encontrar JSON.

**`schemas.ts`** — Schemas Zod para a saída do LLM. `LlmTransactionSchema` valida transações financeiras; `LlmQuerySchema` valida consultas. `LlmOutputSchema` é uma `discriminatedUnion` pelo campo `intent`.

**`sanitize.ts`** — Normaliza campos brutos antes da validação Zod: converte `amount` de string para número (incluindo formato brasileiro com vírgula), reformata datas `dd/mm/yyyy` para `yyyy-mm-dd`, faz trim em strings.

**`confidence.ts`** — Calcula `calculateConfidence(extracted)`: pontuação de 0 a 1 com penalidades por campos ausentes (`category`, `transactionDate`, `amount`, `type`).

**`service.ts`** — Função `parseAiResponse(rawText)`: orquestra extract-json → sanitize → Zod.parse → calculateConfidence. Exporta `AiParseError` para erros tipados da pipeline.

**`intent.ts`** — `detectIntent(message)`: classifica a mensagem como `'create_transaction'` ou `'query'` com base em padrões de regex. Fail-safe: textos ambíguos retornam `'create_transaction'`.

**`prompt-loader.ts`** — `loadPrompt(templateName, vars)`: carrega `src/ai/prompts/{templateName}.md` e substitui placeholders `{{CHAVE}}`. Lança erro se o arquivo não existir ou se algum placeholder ficar sem substituição.

**`llm-client.ts`** — Interface `LlmClient { complete(prompt): Promise<string> }` e implementação `OllamaLlmClient` que chama `POST /api/generate` do Ollama local.

**`fake-llm-client.ts`** — `FakeLlmClient`: implementa `LlmClient` com fila FIFO de respostas pré-programadas. Lança erro quando a fila esgota. Use nos testes para evitar chamadas reais ao Ollama.

**`prompts/transaction-extraction.v1.md`** — Template few-shot em português para extração de transações. Contém instruções, exemplos de despesa e receita, e o placeholder `{{USER_MESSAGE}}`.

**`src/financial/categories.ts`** — `findOrCreateCategory(prisma, userId, name, type)`: busca categoria por nome (case-insensitive) ou cria uma nova normalizada.

**`src/financial/processor.ts`** — `processMessage(message, userId, llm)`: orquestra toda a pipeline. Criação de `Transaction` com `invoiceId` usa `prisma.$transaction([...])` para atomicidade.

---

## Como rodar os testes da Parte B

```bash
# Todos os testes
pnpm test

# Apenas arquivos da Parte B
npx vitest run tests/ai tests/financial/processor
```

---

## Como usar FakeLlmClient nos testes

```ts
import { FakeLlmClient } from '../../src/ai/fake-llm-client';
import fixture from '../../shared/fixtures/expense_simple.json';

const llm = new FakeLlmClient([fixture.llmRawResponse]);
const result = await processMessage('Gastei 50 no mercado', userId, llm);
```

Os fixtures em `shared/fixtures/` contêm respostas LLM pré-gravadas para os cenários mais comuns.
