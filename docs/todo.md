# Todo — Botfinancas

> **Workflow:** diga "continuar" para executar a próxima task `[ ]`. Ver `docs/plan.md §11.5`.
> **Marcadores:** `[ ]` não iniciado · `[*]` em desenvolvimento · `[x]` concluído

---

## Sumário

| Sprint | Tasks | Pré-condição | Estimativa (ideal) |
|---|---|---|---|
| S-0 | T-001 – T-008 (8 tasks) | Nenhuma | ~4h |
| S-1 | T-009 – T-029 (21 tasks) | T-008 | ~10h05min |
| S-2 | T-030 – T-054 (25 tasks) | T-008 (paralela a S-1) | ~10h20min |
| S-3 | T-055 – T-058 (4 tasks) | T-029 + T-054 | ~1h45min |
| **MVP total (S-0 a S-3)** | **58 tasks** | — | **~26h10min** |
| S-4 a S-12 | T-059 – T-067 (9 placeholders) | Placeholder — ver cada task | sem estimativa |

> **Tradução prática do MVP:**
> - **Otimista (sem retrabalho):** ~26h ≈ 3 dias úteis a 8h/dia
> - **Realista (×1.5 — inclui revisão Sonnet, espera Opus, ajustes):** ~40h ≈ 1 semana
> - **Pessimista (×2 — bugs, contexto reset, debug):** ~52h ≈ 1.5 semanas
>
> Estimativas individuais por task estão em cada cabeçalho. Tasks de S-2 podem rodar em paralelo a S-1 (depende só de T-008).

---

## Ondas de Execução (paralelização)

> Cada **onda** é um conjunto de tasks que pode rodar simultaneamente (Sonnet spawna múltiplos Opus). O tempo da onda é o da task mais longa dentro dela. Diga **"continuar paralelo"** para executar a próxima onda inteira; **"continuar"** para uma única task por vez (modo seguro).

### Sprint S-0 — Bootstrap (~3h35min com paralelismo, vs 4h sequencial)
| Onda | Tasks paralelas | Tempo |
|---|---|---|
| 0.1 | T-001 | 30min |
| 0.2 | T-002 | 20min |
| 0.3 | T-003 | 30min |
| 0.4 | T-004 | 60min |
| 0.5 | T-005 \|\| T-006 \|\| T-007 | 45min |
| 0.6 | T-008 (review) | 30min |

### Sprints S-1 + S-2 rodam EM PARALELO após T-008 — duração = max(S-1, S-2) ≈ 6h10min

#### S-1 — Parte A (critical path ~5h50min, vs 10h05min sequencial)
| Onda | Tasks paralelas | Tempo |
|---|---|---|
| 1.A | T-009 \|\| T-010 \|\| T-011 | 20min |
| 1.B | (T-012→T-013) \|\| (T-014→T-015) \|\| (T-016→T-017) \|\| (T-018→T-019) \|\| (T-020→T-021) | 60min |
| 1.C | T-022 (TDD-Test route) | 60min |
| 1.D | T-023 (TDD-Impl route) | 90min |
| 1.E | T-024 (integration) | 45min |
| 1.X (background) | T-025 \|\| T-026 \|\| T-027 (manuais — não bloqueia) | 0min ao critical path |
| 1.F | T-028 (README) | 30min |
| 1.G | T-029 (review) | 45min |

#### S-2 — Parte B (critical path ~6h10min, vs 10h20min sequencial)
| Onda | Tasks paralelas | Tempo |
|---|---|---|
| 2.A | (T-030→T-031) \|\| (T-032→T-033) \|\| (T-038→T-039) \|\| (T-040→T-041) \|\| (T-044→T-045) | 55min |
| 2.B | (T-034→T-035) \|\| (T-036→T-037) \|\| T-046 | 40min |
| 2.C | T-047 → T-048 | 40min |
| 2.D | T-049 → T-050 | 55min |
| 2.E | T-042 → T-043 (service) | 65min |
| 2.F | T-051 → T-052 (processor) | 85min |
| 2.G | T-053 \|\| T-054 (review) | 30min |

### Sprint S-3 — Integração (~1h45min, sequencial)
| Onda | Tasks | Tempo |
|---|---|---|
| 3.1 | T-055 | 20min |
| 3.2 | T-056 | 40min |
| 3.3 | T-057 (smoke) | 15min |
| 3.4 | T-058 (review final) | 30min |

### Resumo de tempo

| Cenário | Tempo total | Economia |
|---|---|---|
| Sequencial puro (1 task por vez) | ~26h10min | — |
| **Critical path com paralelismo total** | **~11h30min** | **-56%** |
| Realista (2–3 frentes simultâneas + overhead) | ~16h | -38% |

---

## Protocolo de Auto-Resumo (Token Limit / Reset de Contexto)

> Para o Sonnet preservar estado quando o contexto está perto do limite ou quando o usuário pede "salva o estado".

### Quando salvar
- Sonnet detecta que está em sessão longa (>80% do contexto típico) **OU**
- Usuário diz **"salva o estado"** / **"vou parar"** / **"continua amanhã"** **OU**
- Antes de qualquer task que vai produzir muito output (review longa, integration test grande)

### O que salvar
Criar/sobrescrever o arquivo `current-state.md` na raiz do projeto com:

```markdown
# Estado da Sessão — <data ISO>

## Última task executada
- ID: T-XXX
- Status: [iniciada | red | green | revisada | committed]
- Resultado: <1-2 linhas do que aconteceu>

## Próxima task a executar
- ID: T-XXX (ver todo.md)
- Pré-condições satisfeitas? [sim/não]
- Bloqueios conhecidos: <lista ou "nenhum">

## Tasks em andamento (paralelo)
- T-XXX: <estado>
- T-YYY: <estado>

## Decisões tomadas nesta sessão
- <ex: "escolhemos usar zod-to-json-schema em vez de gerar manualmente">
- <ex: "ajustamos T-040 para usar mock de DB, não real">

## Pendências para próxima sessão
- [ ] <ex: "humano precisa rodar pnpm migrate dev antes de T-022">
- [ ] <ex: "verificar se Tailscale Funnel ainda está ativo">

## Comandos úteis para retomar
- pnpm dev (porta 3000)
- pnpm test --watch
- <outros relevantes>
```

### Como retomar na próxima sessão
1. **Primeira ação ao iniciar:** ler `current-state.md` se existir
2. Confirmar com humano: "última sessão parou em T-XXX [estado]. Próxima: T-YYY. Continuar?"
3. Se humano confirmar, executar T-YYY com o protocolo normal
4. Após retomar com sucesso, deletar ou arquivar `current-state.md` (mover para `.history/` se quiser histórico)

### Regras
- **Nunca** salvar `current-state.md` no meio de uma task em vermelho/quebrada — termine ou reverta primeiro
- **Sempre** fazer `git status` antes de salvar — se há arquivos não-committed, mencionar no resumo
- O arquivo é **efêmero**: vive entre sessões, é apagado ao retomar com sucesso
- Adicionar `current-state.md` ao `.gitignore` (não é versionado)

---

## Sprint S-0 — Bootstrap do Repositório

---

## [x] T-001: Inicializar repositório Next.js 14 + TypeScript strict

| Campo | Valor |
|---|---|
| **Sprint** | S-0 |
| **Camada** | Compartilhado |
| **Tipo** | Setup |
| **Depende de** | nenhuma |
| **Estimativa** | ~30min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `package.json`, `pnpm-lock.yaml`
- `tsconfig.json`
- `next.config.mjs`
- `.gitignore`
- `.eslintrc.json` ou `eslint.config.mjs`
- `src/app/page.tsx`, `src/app/layout.tsx` (esqueleto mínimo)

### Arquivos proibidos de tocar
- `prisma/`, `shared/`, `specs/`, `docs/plan.md`, `todo.md`

### Critérios de aceite
- [ ] `package.json` declara `next@^14`, `typescript@^5`, `@types/node`, `@types/react`
- [ ] `tsconfig.json`: `"strict": true`, `"noUncheckedIndexedAccess": true`, `"target": "ES2022"`, `"module": "ESNext"`, `"moduleResolution": "bundler"`
- [ ] `pnpm install` roda sem erro
- [ ] `pnpm dev` sobe em :3000 e responde 200
- [ ] `pnpm lint` roda sem erros (ESLint configurado pelo Next.js)
- [ ] Nenhum arquivo de exemplo do create-next-app permanece (Tailwind, páginas de demo)

### Prompt pronto para execução
```
PROJETO: Botfinancas — bot pessoal de finanças via Telegram com IA local (Ollama)
TAREFA: T-001 — Inicializar repositório Next.js 14 + TypeScript strict
SPRINT: S-0 | TIPO: Setup

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9 (regras de execução)
2. docs/specs/00-contratos-compartilhados.md §1 (stack base) e §6 (estrutura de diretórios)

OBJETIVO:
Criar o esqueleto Next.js 14 + TypeScript do projeto, sem qualquer feature, pronto para receber as tasks seguintes.

ESCOPO:
- Rodar: pnpm create next-app . --typescript --app --src-dir --import-alias "@/*" (sem --no-eslint, sem --no-tailwind a não ser que o template force)
- Remover todo conteúdo de demonstração do create-next-app (globals.css de demonstração, conteúdo de page.tsx, etc.)
- Ajustar tsconfig.json conforme docs/specs/00 §1: strict=true, noUncheckedIndexedAccess=true, target=ES2022, module=ESNext, moduleResolution=bundler
- Ajustar .gitignore: Node, Next.js, Prisma, .env.local

FORA DE ESCOPO:
- NÃO instalar Prisma, Zod, Vitest, Pino — vão em T-002
- NÃO criar nenhuma rota além da raiz
- NÃO criar shared/, prisma/, specs/

ARQUIVOS PERMITIDOS:
- package.json, pnpm-lock.yaml, tsconfig.json, next.config.mjs, .gitignore
- eslint.config.mjs (ou .eslintrc.json), src/app/page.tsx, src/app/layout.tsx

ARQUIVOS PROIBIDOS:
- prisma/, shared/, specs/*, docs/plan.md, todo.md — qualquer coisa não listada acima

CRITÉRIOS DE ACEITE:
- [ ] tsconfig.json com strict, noUncheckedIndexedAccess, target ES2022, module ESNext, moduleResolution bundler
- [ ] pnpm install sem erro
- [ ] pnpm dev sobe em :3000
- [ ] pnpm lint sem erros

DEFINIÇÃO DE PRONTO:
1. Reporte: arquivos criados/modificados, output de pnpm dev (200 em /), output de pnpm lint.
2. NÃO faça commit. NÃO marque [x].
3. Pare.

GATILHOS PARA PARAR:
- tsconfig não aceita as opções (versão TS incompatível)
- pnpm lint falha com erros não triviais
- Tempo > 1h
```

### Checklist de fechamento
- [ ] Critérios de aceite verificados
- [ ] `pnpm dev` testado manualmente
- [ ] Commit `T-001: bootstrap Next.js 14 + TypeScript strict`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [x] T-002: Instalar todas as dependências do projeto

| Campo | Valor |
|---|---|
| **Sprint** | S-0 |
| **Camada** | Compartilhado |
| **Tipo** | Setup |
| **Depende de** | T-001 |
| **Estimativa** | ~20min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `package.json`, `pnpm-lock.yaml`

### Arquivos proibidos de tocar
- Todo o resto

### Critérios de aceite
- [ ] Deps de produção: `next@^14`, `@prisma/client`, `zod`, `pino`, `date-fns`, `date-fns-tz`
- [ ] Deps de dev: `prisma`, `pino-pretty`, `vitest`, `@vitest/ui`, `@types/node`, `typescript`
- [ ] `pnpm install` sem erro
- [ ] `pnpm dev` ainda sobe

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-002 — Instalar dependências
SPRINT: S-0 | TIPO: Setup

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9
2. docs/specs/00 §1 (stack), docs/specs/01 §3 (stack Parte A), docs/specs/02 §3 (stack Parte B)

OBJETIVO:
Instalar todas as dependências listadas nas specs em uma única passagem, sem instalar nada extra.

ESCOPO:
pnpm add next@14 @prisma/client zod pino date-fns date-fns-tz
pnpm add -D prisma pino-pretty vitest @vitest/ui typescript @types/node @types/react @types/react-dom

FORA DE ESCOPO:
- NÃO instalar ollama-sdk, MSW, supertest ou qualquer lib não listada nas specs
- NÃO criar arquivos além de package.json e pnpm-lock.yaml

ARQUIVOS PERMITIDOS: package.json, pnpm-lock.yaml
ARQUIVOS PROIBIDOS: tudo mais

CRITÉRIOS DE ACEITE:
- [ ] Todas as deps listadas no ESCOPO acima presentes no package.json
- [ ] pnpm install sem erro
- [ ] pnpm dev ainda sobe

DEFINIÇÃO DE PRONTO:
1. Reporte deps instaladas e output de pnpm install.
2. NÃO faça commit. NÃO marque [x].
3. Pare.

GATILHOS PARA PARAR: conflito de versões irresolvível; Tempo > 30min.
```

### Checklist de fechamento
- [ ] Critérios verificados
- [ ] Commit `T-002: instalar dependências`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [x] T-003: Configurar Vitest + vitest.config.ts + tests/setup.ts

| Campo | Valor |
|---|---|
| **Sprint** | S-0 |
| **Camada** | Compartilhado |
| **Tipo** | Setup |
| **Depende de** | T-002 |
| **Estimativa** | ~30min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `vitest.config.ts`
- `tests/setup.ts`

### Arquivos proibidos de tocar
- Todo o resto

### Critérios de aceite
- [ ] `vitest.config.ts` na raiz com `globals: true`, `setupFiles: ['./tests/setup.ts']`, `environment: 'node'`, `pool: 'forks'`, `poolOptions: { forks: { singleFork: true } }`, `testTimeout: 15_000`
- [ ] `tests/setup.ts` implementado exatamente conforme docs/specs/00 §7 (beforeAll migrate, beforeEach truncate, afterAll disconnect)
- [ ] `pnpm test` roda sem erro (sem testes ainda, apenas setup)

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-003 — Configurar Vitest + tests/setup.ts
SPRINT: S-0 | TIPO: Setup

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9
2. docs/specs/00 §7 (Setup de testes — ler INTEIRO, copiar exatamente)

OBJETIVO:
Criar vitest.config.ts e tests/setup.ts exatamente conforme docs/specs/00 §7, sem modificar nada além desses dois arquivos.

ESCOPO:
- Criar vitest.config.ts na raiz com as opções exatas de docs/specs/00 §7
- Criar tests/setup.ts com o conteúdo exato de docs/specs/00 §7 (beforeAll/beforeEach/afterAll)
- O tests/setup.ts usa TEST_DATABASE_URL (não DATABASE_URL)

FORA DE ESCOPO:
- NÃO criar testes ainda
- NÃO instalar deps (já feito em T-002)
- NÃO modificar tsconfig ou package.json

ARQUIVOS PERMITIDOS: vitest.config.ts, tests/setup.ts
ARQUIVOS PROIBIDOS: tudo mais

CRITÉRIOS DE ACEITE:
- [ ] vitest.config.ts existe com todas as opções de docs/specs/00 §7
- [ ] tests/setup.ts existe com beforeAll/beforeEach/afterAll corretos
- [ ] pnpm test roda sem erro (0 testes, mas setup executa sem crash)

DEFINIÇÃO DE PRONTO:
1. Reporte conteúdo dos dois arquivos criados e output de pnpm test.
2. NÃO faça commit. NÃO marque [x].
3. Pare.

GATILHOS PARA PARAR: TEST_DATABASE_URL não está definida (orientar humano a criar .env.test); pnpm test crasha com erro não relacionado a falta de testes.
```

### Checklist de fechamento
- [ ] Critérios verificados
- [ ] Commit `T-003: configurar Vitest e tests/setup.ts`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [*] T-004: Criar prisma/schema.prisma + migration inicial

| Campo | Valor |
|---|---|
| **Sprint** | S-0 |
| **Camada** | Compartilhado |
| **Tipo** | Setup |
| **Depende de** | T-002 |
| **Estimativa** | ~1h |
| **Pode rodar em paralelo com** | T-003 |

### Arquivos permitidos para criar/editar
- `prisma/schema.prisma`
- `prisma/migrations/` (gerado automaticamente)
- `.env.example` (apenas DATABASE_URL e TEST_DATABASE_URL, resto em T-007)

### Arquivos proibidos de tocar
- `shared/`, `src/`, `specs/`, `docs/plan.md`, `todo.md`

### Critérios de aceite
- [ ] `prisma/schema.prisma` contém todos os models de docs/specs/00 §2: User, Contact, Account, Invoice, InvoicePayment, Category, Transaction, SharedSplit, SplitSettlement, RecurringExpense, Budget, Reminder, MessageLog, AiInference, MemoryEntry
- [ ] Todos os enums presentes: AccountType, InvoiceStatus, TransactionType, TransactionDirection, TransactionSource, TransactionStatus, SplitStatus, RecurringPeriod, BudgetPeriod, ReminderType, ReminderStatus, MessageType, CategoryType, InferenceStatus
- [ ] `pnpm prisma migrate dev --name init` aplica sem erro no banco de dev
- [ ] `pnpm prisma generate` gera o client sem erro

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-004 — Criar prisma/schema.prisma + migration inicial
SPRINT: S-0 | TIPO: Setup

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9
2. docs/specs/00 §2 (Schema do banco — ler INTEIRO, copiar exatamente)
3. docs/specs/00 §5 (variáveis de ambiente — apenas DATABASE_URL e TEST_DATABASE_URL)

OBJETIVO:
Criar o schema Prisma completo conforme docs/specs/00 §2, incluindo todos os modelos, relações, índices e enums. Rodar a migration inicial.

ESCOPO:
- Criar prisma/schema.prisma copiando EXATAMENTE o schema de docs/specs/00 §2
- Adicionar DATABASE_URL ao .env.example (apenas essa linha, se o arquivo não existir)
- Rodar: pnpm prisma migrate dev --name init (banco local deve estar rodando)
- Rodar: pnpm prisma generate

FORA DE ESCOPO:
- NÃO criar seed
- NÃO modificar nada fora de prisma/ e .env.example
- NÃO inventar campos que não estão no schema de docs/specs/00 §2

ARQUIVOS PERMITIDOS: prisma/schema.prisma, prisma/migrations/**, .env.example
ARQUIVOS PROIBIDOS: src/**, shared/**, specs/*, docs/plan.md, todo.md

CRITÉRIOS DE ACEITE:
- [ ] Todos os 15 models e 14 enums de docs/specs/00 §2 presentes
- [ ] pnpm prisma migrate dev --name init sem erro
- [ ] pnpm prisma generate sem erro

DEFINIÇÃO DE PRONTO:
1. Reporte: lista de models criados, output de migrate dev, output de generate.
2. NÃO faça commit. NÃO marque [x].
3. Pare.

GATILHOS PARA PARAR: banco PostgreSQL não está rodando (orientar humano a subir banco); erro de schema inválido após múltiplas tentativas de correção.
```

### Checklist de fechamento
- [ ] Critérios verificados
- [ ] `pnpm prisma migrate dev` testado com banco rodando
- [ ] Commit `T-004: schema Prisma completo + migration init`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-005: Criar shared/contract.ts

| Campo | Valor |
|---|---|
| **Sprint** | S-0 |
| **Camada** | Compartilhado |
| **Tipo** | Setup |
| **Depende de** | T-001 |
| **Estimativa** | ~15min |
| **Pode rodar em paralelo com** | T-003, T-004 |

### Arquivos permitidos para criar/editar
- `shared/contract.ts`

### Arquivos proibidos de tocar
- Todo o resto

### Critérios de aceite
- [ ] `shared/contract.ts` existe com `ProcessInput`, `ProcessResult` (union de 4 kinds), `MessageProcessor`
- [ ] Compila sem erro: `pnpm exec tsc --noEmit`

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-005 — Criar shared/contract.ts
SPRINT: S-0 | TIPO: Setup

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9
2. docs/specs/00 §3 (Contrato processMessage — copiar EXATAMENTE)

OBJETIVO:
Criar shared/contract.ts copiando exatamente o conteúdo de docs/specs/00 §3. Nenhuma modificação.

ESCOPO:
- mkdir shared/ se não existir
- Criar shared/contract.ts com o conteúdo de docs/specs/00 §3

FORA DE ESCOPO:
- NÃO modificar o contrato
- NÃO criar outros arquivos em shared/

ARQUIVOS PERMITIDOS: shared/contract.ts
ARQUIVOS PROIBIDOS: tudo mais

CRITÉRIOS DE ACEITE:
- [ ] shared/contract.ts existe com ProcessInput, ProcessResult (4 kinds), MessageProcessor
- [ ] pnpm exec tsc --noEmit não aponta erro nesse arquivo

DEFINIÇÃO DE PRONTO:
1. Reporte conteúdo do arquivo e output do tsc.
2. NÃO faça commit. NÃO marque [x].
3. Pare.

GATILHOS PARA PARAR: erro de compilação TypeScript que indica problema no contrato em si.
```

### Checklist de fechamento
- [ ] Critérios verificados
- [ ] Commit `T-005: shared/contract.ts`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-006: Criar shared/fixtures/*.json (9 fixtures do MVP)

| Campo | Valor |
|---|---|
| **Sprint** | S-0 |
| **Camada** | Compartilhado |
| **Tipo** | Setup |
| **Depende de** | T-001 |
| **Estimativa** | ~45min |
| **Pode rodar em paralelo com** | T-003, T-004, T-005 |

### Arquivos permitidos para criar/editar
- `shared/fixtures/expense_simple.json`
- `shared/fixtures/income_salary.json`
- `shared/fixtures/expense_with_card.json`
- `shared/fixtures/llm_with_markdown.json`
- `shared/fixtures/llm_with_prefix.json`
- `shared/fixtures/llm_low_confidence.json`
- `shared/fixtures/llm_invalid_json.json`
- `shared/fixtures/llm_negative_amount.json`
- `shared/fixtures/query_balance.json`

### Arquivos proibidos de tocar
- Todo o resto

### Critérios de aceite
- [ ] 9 arquivos JSON em `shared/fixtures/` com os nomes exatos acima
- [ ] Cada arquivo segue a estrutura de docs/specs/00 §4: `name`, `input`, `llmRawResponse`, `expected`
- [ ] `currentDate` = `"2026-05-13"` em todas as fixtures
- [ ] `llmRawResponse` é string JSON serializado (não objeto)
- [ ] `llm_invalid_json.llmRawResponse` = string que não é JSON válido
- [ ] `llm_negative_amount.llmRawResponse` = JSON válido com amount negativo
- [ ] `llm_low_confidence.llmRawResponse` = JSON válido com confidence entre 0.60 e 0.84

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-006 — Criar shared/fixtures/*.json (9 fixtures MVP)
SPRINT: S-0 | TIPO: Setup

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9
2. docs/specs/00 §4 (Fixtures compartilhadas — INTEIRO, incluindo estrutura e tabela de fixtures obrigatórias)
3. docs/specs/02 §6 (Schema Zod da saída do LLM — para saber o formato de llmRawResponse)

OBJETIVO:
Criar as 9 fixtures JSON do MVP em shared/fixtures/, seguindo a estrutura e convenções de docs/specs/00 §4.

ESCOPO:
- Criar shared/fixtures/ se não existir
- Criar os 9 arquivos listados, cada um com: name, input (text + currentDate), llmRawResponse (string), expected
- llmRawResponse deve ser uma string JSON serializada (JSON.stringify de um objeto com os campos do LlmTransactionSchema ou LlmQuerySchema de docs/specs/02 §6)
- currentDate = "2026-05-13" em todas
- Para expense_simple: input.text = "Gastei 50 no mercado ontem", transactionDate = "2026-05-12", confidence = 0.92
- Para income_salary: input.text = "Recebi 3000 de salario", type = "income", confidence = 0.95
- Para expense_with_card: input.text = "Paguei 120 no cartão Nubank", paymentMethod = "Nubank", confidence = 0.90
- Para llm_with_markdown: llmRawResponse começa com "```json\n" e termina com "\n```", conteúdo válido
- Para llm_with_prefix: llmRawResponse começa com "Claro! Aqui está: " seguido do JSON
- Para llm_low_confidence: confidence = 0.70 (entre 0.60 e 0.84), expected.kind = "needs_confirmation"
- Para llm_invalid_json: llmRawResponse = "isso não é json {broken"
- Para llm_negative_amount: llmRawResponse = JSON com amount = -50
- Para query_balance: input.text = "quanto gastei hoje?", llmRawResponse com intent = "query", expected.kind = "query_answered"

FORA DE ESCOPO:
- NÃO criar fixtures expandidas (S-4 a S-8) — apenas as 9 do MVP
- NÃO modificar nada fora de shared/fixtures/

ARQUIVOS PERMITIDOS: shared/fixtures/*.json (apenas os 9 listados)
ARQUIVOS PROIBIDOS: tudo mais

CRITÉRIOS DE ACEITE:
- [ ] 9 arquivos JSON existem com nomes corretos
- [ ] Todos parseable com JSON.parse sem erro (exceto conteúdo de llmRawResponse que propositalmente é inválido em llm_invalid_json)
- [ ] Estrutura correta: name, input.text, input.currentDate, llmRawResponse (string), expected.kind

DEFINIÇÃO DE PRONTO:
1. Reporte lista dos 9 arquivos criados com resumo do conteúdo de cada um.
2. NÃO faça commit. NÃO marque [x].
3. Pare.

GATILHOS PARA PARAR: dúvida sobre o valor de algum campo que possa impactar os testes da Parte B.
```

### Checklist de fechamento
- [ ] Critérios verificados
- [ ] Commit `T-006: shared/fixtures 9 fixtures MVP`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-007: Criar .env.example completo

| Campo | Valor |
|---|---|
| **Sprint** | S-0 |
| **Camada** | Compartilhado |
| **Tipo** | Setup |
| **Depende de** | T-001 |
| **Estimativa** | ~10min |
| **Pode rodar em paralelo com** | T-003, T-004, T-005, T-006 |

### Arquivos permitidos para criar/editar
- `.env.example`
- `.gitignore` (apenas para garantir `.env.local` está ignorado)

### Critérios de aceite
- [ ] `.env.example` contém todas as vars de docs/specs/00 §5: DATABASE_URL, TEST_DATABASE_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, TELEGRAM_ALLOWED_USER_IDS, OLLAMA_BASE_URL, OLLAMA_TEXT_MODEL, LOG_LEVEL, NODE_ENV
- [ ] `.env.local` está no `.gitignore`

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-007 — Criar .env.example
SPRINT: S-0 | TIPO: Setup

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9
2. docs/specs/00 §5 (Variáveis de ambiente — copiar exatamente)

OBJETIVO:
Criar .env.example com todas as variáveis de docs/specs/00 §5 e garantir que .env.local está no .gitignore.

ARQUIVOS PERMITIDOS: .env.example, .gitignore
ARQUIVOS PROIBIDOS: tudo mais

CRITÉRIOS DE ACEITE:
- [ ] .env.example com todas as 9 vars de docs/specs/00 §5
- [ ] .env.local no .gitignore

DEFINIÇÃO DE PRONTO:
1. Reporte conteúdo do .env.example.
2. NÃO faça commit. NÃO marque [x].
3. Pare.
```

### Checklist de fechamento
- [ ] Critérios verificados
- [ ] Commit `T-007: .env.example`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-008: Review S-0

| Campo | Valor |
|---|---|
| **Sprint** | S-0 |
| **Camada** | Compartilhado |
| **Tipo** | Review |
| **Depende de** | T-001, T-002, T-003, T-004, T-005, T-006, T-007 |
| **Estimativa** | ~30min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- Nenhum (apenas leitura)

### Critérios de aceite
- [ ] `pnpm install` limpo
- [ ] `pnpm dev` sobe em :3000
- [ ] `pnpm test` roda (0 testes, setup sem crash)
- [ ] `pnpm lint` sem erros
- [ ] `pnpm prisma generate` sem erro
- [ ] Todos os 9 arquivos de fixtures existem em `shared/fixtures/`
- [ ] `shared/contract.ts` compila sem erro
- [ ] `.env.example` completo

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-008 — Review S-0
SPRINT: S-0 | TIPO: Review

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9, §10, §11

OBJETIVO:
Validar que todos os entregáveis de S-0 estão corretos e a sprint pode ser declarada fechada.

ESCOPO:
- Executar: pnpm install, pnpm dev (verificar :3000), pnpm test, pnpm lint, pnpm prisma generate
- Verificar existência e estrutura de: shared/contract.ts, shared/fixtures/ (9 arquivos), .env.example, vitest.config.ts, tests/setup.ts, prisma/schema.prisma
- Para cada critério de aceite acima, marcar verde ou vermelho

FORA DE ESCOPO:
- NÃO corrigir problemas encontrados nesta task — abrir nota e reportar

ARQUIVOS PERMITIDOS: nenhum (read-only)
ARQUIVOS PROIBIDOS: tudo

CRITÉRIOS DE ACEITE: todos os listados acima

DEFINIÇÃO DE PRONTO:
1. Reporte checklist completo (verde/vermelho por item) e output de cada comando.
2. Se tudo verde: "S-0 aprovada, S-1 e S-2 podem começar em paralelo."
3. Se algum vermelho: descreva o problema sem corrigir.
4. NÃO faça commit. Pare.
```

### Checklist de fechamento
- [ ] Todos os critérios verdes
- [ ] Commit `T-008: review S-0 aprovada`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## Sprint S-1 — Parte A: Infra, Webhook, Persistência

> Pré-condição: T-008 `[x]`. S-1 e S-2 podem rodar em paralelo após T-008.

---

## [ ] T-009: GET /api/health + servidor mínimo rodando

| Campo | Valor |
|---|---|
| **Sprint** | S-1 |
| **Camada** | Parte A |
| **Tipo** | Setup |
| **Depende de** | T-008 |
| **Estimativa** | ~20min |
| **Pode rodar em paralelo com** | T-030 (S-2 pode começar) |

### Arquivos permitidos para criar/editar
- `src/app/api/health/route.ts`

### Arquivos proibidos de tocar
- `src/ai/`, `src/financial/`, `prompts/`, `prisma/schema.prisma`, `shared/`, `specs/`, `docs/plan.md`, `todo.md`

### Critérios de aceite
- [ ] `GET /api/health` retorna 200 com body `{ "status": "ok" }`
- [ ] `pnpm dev` sobe e a rota responde

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-009 — GET /api/health
SPRINT: S-1 | TIPO: Setup

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9
2. docs/specs/01 §4 (estrutura de arquivos — apenas a parte de health/)

OBJETIVO:
Criar src/app/api/health/route.ts que retorna { "status": "ok" } com HTTP 200. Sem TDD.

ARQUIVOS PERMITIDOS: src/app/api/health/route.ts
ARQUIVOS PROIBIDOS: src/ai/**, src/financial/**, prompts/**, prisma/schema.prisma, shared/**, specs/*, docs/plan.md, todo.md

CRITÉRIOS DE ACEITE:
- [ ] GET /api/health retorna 200 com { status: "ok" }
- [ ] pnpm lint sem erros nesse arquivo

DEFINIÇÃO DE PRONTO:
1. Reporte o arquivo criado e resultado de curl /api/health.
2. NÃO faça commit. NÃO marque [x].
3. Pare.
```

### Checklist de fechamento
- [ ] Critérios verificados
- [ ] Commit `T-009: GET /api/health`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-010: src/lib/prisma.ts + src/lib/logger.ts

| Campo | Valor |
|---|---|
| **Sprint** | S-1 |
| **Camada** | Parte A |
| **Tipo** | Setup |
| **Depende de** | T-008 |
| **Estimativa** | ~20min |
| **Pode rodar em paralelo com** | T-009, T-030 |

### Arquivos permitidos para criar/editar
- `src/lib/prisma.ts`
- `src/lib/logger.ts`

### Arquivos proibidos de tocar
- `src/ai/`, `src/financial/`, `prompts/`, `prisma/schema.prisma`, `shared/`, `specs/`, `docs/plan.md`, `todo.md`

### Critérios de aceite
- [ ] `src/lib/prisma.ts`: singleton PrismaClient com hot-reload guard (global var)
- [ ] `src/lib/logger.ts`: pino logger exportado, LOG_LEVEL de env
- [ ] `pnpm exec tsc --noEmit` sem erro nesses arquivos

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-010 — src/lib/prisma.ts + src/lib/logger.ts
SPRINT: S-1 | TIPO: Setup

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9
2. docs/specs/01 §8 (regras não-óbvias — item sobre singleton PrismaClient e logger)

OBJETIVO:
Criar singleton do PrismaClient (evita múltiplas conexões em hot reload Next.js) e logger pino.

ESCOPO:
- src/lib/prisma.ts: usar global para memoizar PrismaClient em dev (padrão oficial Prisma + Next.js)
- src/lib/logger.ts: criar logger pino com level = process.env.LOG_LEVEL ?? 'info'

FORA DE ESCOPO:
- NÃO criar src/lib/env.ts (será T-012/T-013)

ARQUIVOS PERMITIDOS: src/lib/prisma.ts, src/lib/logger.ts
ARQUIVOS PROIBIDOS: src/ai/**, src/financial/**, prompts/**, prisma/schema.prisma, shared/**, specs/*, docs/plan.md, todo.md

CRITÉRIOS DE ACEITE:
- [ ] prisma.ts exporta PrismaClient singleton
- [ ] logger.ts exporta logger pino
- [ ] tsc --noEmit sem erro

DEFINIÇÃO DE PRONTO:
1. Reporte os dois arquivos criados.
2. NÃO faça commit. NÃO marque [x].
3. Pare.
```

### Checklist de fechamento
- [ ] Critérios verificados
- [ ] Commit `T-010: src/lib/prisma.ts + logger.ts`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-011: src/processor/stub.ts

| Campo | Valor |
|---|---|
| **Sprint** | S-1 |
| **Camada** | Parte A |
| **Tipo** | Setup |
| **Depende de** | T-005 |
| **Estimativa** | ~10min |
| **Pode rodar em paralelo com** | T-009, T-010, T-030 |

### Arquivos permitidos para criar/editar
- `src/processor/stub.ts`

### Arquivos proibidos de tocar
- Todo o resto

### Critérios de aceite
- [ ] `src/processor/stub.ts` exporta `stubProcessor: MessageProcessor` conforme docs/specs/01 §5
- [ ] Importa tipos de `../../shared/contract`
- [ ] Compila sem erro

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-011 — src/processor/stub.ts
SPRINT: S-1 | TIPO: Setup

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9
2. docs/specs/01 §5 (Stub de processMessage — copiar EXATAMENTE)

OBJETIVO:
Criar src/processor/stub.ts copiando exatamente o conteúdo de docs/specs/01 §5.

ARQUIVOS PERMITIDOS: src/processor/stub.ts
ARQUIVOS PROIBIDOS: tudo mais

CRITÉRIOS DE ACEITE:
- [ ] stubProcessor exportado conforme docs/specs/01 §5
- [ ] tsc --noEmit sem erro

DEFINIÇÃO DE PRONTO:
1. Reporte o arquivo criado. NÃO faça commit. NÃO marque [x]. Pare.
```

### Checklist de fechamento
- [ ] Critérios verificados
- [ ] Commit `T-011: src/processor/stub.ts`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-012: TDD-Test — src/lib/env.ts (testes falhando)

| Campo | Valor |
|---|---|
| **Sprint** | S-1 |
| **Camada** | Parte A |
| **Tipo** | TDD-Test |
| **Depende de** | T-003, T-009 |
| **Estimativa** | ~20min |
| **Pode rodar em paralelo com** | T-030 |

### Arquivos permitidos para criar/editar
- `tests/webhook/env.test.ts`

### Arquivos proibidos de tocar
- `src/lib/env.ts` (implementação vem em T-013), todo o resto

### Critérios de aceite
- [ ] `tests/webhook/env.test.ts` existe com testes para: variáveis obrigatórias presentes (passa), DATABASE_URL ausente (lança), TELEGRAM_BOT_TOKEN ausente (lança), NODE_ENV inválido (lança), valores válidos retornam objeto tipado
- [ ] `pnpm test tests/webhook/env.test.ts` falha (red) pois src/lib/env.ts não existe

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-012 — TDD-Test env.ts
SPRINT: S-1 | TIPO: TDD-Test

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9
2. docs/specs/00 §5 (vars de ambiente) e docs/specs/01 §8 (regra: validação de env com Zod que falha no boot)

OBJETIVO:
Escrever testes para src/lib/env.ts que validem as env vars com Zod. Os testes DEVEM FALHAR ao final desta task.

ESCOPO:
- Criar tests/webhook/env.test.ts
- Testar: todas vars presentes → retorna objeto; var obrigatória ausente → lança; valor inválido → lança
- Importar de src/lib/env.ts (não existe ainda — vai falhar no import)

ABORDAGEM TDD:
1. Escrever os testes com assertions concretas
2. Rodar pnpm test tests/webhook/env.test.ts
3. Confirmar: falha por import error (red) ✓

ARQUIVOS PERMITIDOS: tests/webhook/env.test.ts
ARQUIVOS PROIBIDOS: src/lib/env.ts e tudo mais

CRITÉRIOS DE ACEITE:
- [ ] tests/webhook/env.test.ts existe com ao menos 5 testes
- [ ] pnpm test tests/webhook/env.test.ts falha (red)

DEFINIÇÃO DE PRONTO:
1. Reporte os testes escritos e output mostrando red. NÃO faça commit. NÃO marque [x]. Pare.
```

### Checklist de fechamento
- [ ] Critérios verificados (red confirmado)
- [ ] Commit `T-012: TDD-Test env.ts (red)`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-013: TDD-Impl — src/lib/env.ts

| Campo | Valor |
|---|---|
| **Sprint** | S-1 |
| **Camada** | Parte A |
| **Tipo** | TDD-Impl |
| **Depende de** | T-012 |
| **Estimativa** | ~25min |
| **Pode rodar em paralelo com** | nenhuma (depende de T-012) |

### Arquivos permitidos para criar/editar
- `src/lib/env.ts`

### Arquivos proibidos de tocar
- `tests/webhook/env.test.ts` (não modificar os testes), todo o resto

### Critérios de aceite
- [ ] Todos os testes de T-012 passam (green)
- [ ] `pnpm test` completo verde
- [ ] `pnpm lint` sem erros

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-013 — TDD-Impl env.ts
SPRINT: S-1 | TIPO: TDD-Impl

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9 (especialmente R-5: quando teste falha, conserte código, não teste)
2. docs/specs/01 §8 (regra: validação Zod que falha no boot)
3. docs/specs/00 §5 (lista das vars de ambiente a validar)

OBJETIVO:
Implementar src/lib/env.ts com Zod para que todos os testes de tests/webhook/env.test.ts passem.

ESCOPO:
- Criar src/lib/env.ts: schema Zod para todas as vars de docs/specs/00 §5; parse process.env; exportar objeto tipado; lançar erro descritivo se inválido
- NÃO modificar os testes

ABORDAGEM TDD:
1. Implementar src/lib/env.ts
2. pnpm test tests/webhook/env.test.ts → green
3. pnpm test (suite completa) → verde
4. pnpm lint → sem erros

ARQUIVOS PERMITIDOS: src/lib/env.ts
ARQUIVOS PROIBIDOS: tests/webhook/env.test.ts, tudo mais

CRITÉRIOS DE ACEITE:
- [ ] Todos os testes de T-012 passam
- [ ] pnpm test 100% verde
- [ ] pnpm lint sem erros

DEFINIÇÃO DE PRONTO:
1. Reporte src/lib/env.ts criado, output de pnpm test (verde). NÃO faça commit. NÃO marque [x]. Pare.
```

### Checklist de fechamento
- [ ] Critérios verificados
- [ ] Commit `T-013: TDD-Impl env.ts`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-014: TDD-Test — src/webhook/auth.ts (testes falhando)

| Campo | Valor |
|---|---|
| **Sprint** | S-1 |
| **Camada** | Parte A |
| **Tipo** | TDD-Test |
| **Depende de** | T-013 |
| **Estimativa** | ~30min |
| **Pode rodar em paralelo com** | T-030, T-032 |

### Arquivos permitidos para criar/editar
- `tests/webhook/auth.test.ts`

### Arquivos proibidos de tocar
- `src/webhook/auth.ts`, todo o resto

### Critérios de aceite
- [ ] `tests/webhook/auth.test.ts` contém os 8 `it()` exatos de docs/specs/01 §7 (bloco `auth.test.ts`)
- [ ] `pnpm test tests/webhook/auth.test.ts` falha (red)

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-014 — TDD-Test auth.ts
SPRINT: S-1 | TIPO: TDD-Test

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9
2. docs/specs/01 §7 (bloco tests/webhook/auth.test.ts — copiar os 8 it() exatos)
3. docs/specs/01 §8 (regras: fail closed para secret vazio e allowlist vazia)

OBJETIVO:
Escrever tests/webhook/auth.test.ts com os 8 testes de docs/specs/01 §7. Os testes DEVEM FALHAR.

ESCOPO:
- Criar tests/webhook/auth.test.ts
- Importar validateTelegramSecret e isUserAllowed de src/webhook/auth (não existe — vai dar import error)
- Implementar os 8 it() com assertions concretas usando process.env mock ou vi.stubEnv
- Rodar pnpm test tests/webhook/auth.test.ts → red

ARQUIVOS PERMITIDOS: tests/webhook/auth.test.ts
ARQUIVOS PROIBIDOS: src/webhook/auth.ts, tudo mais

CRITÉRIOS DE ACEITE:
- [ ] 8 it() dos dois describe() de docs/specs/01 §7 presentes
- [ ] pnpm test tests/webhook/auth.test.ts falha (red)

DEFINIÇÃO DE PRONTO:
1. Reporte os 8 testes e output red. NÃO faça commit. NÃO marque [x]. Pare.
```

### Checklist de fechamento
- [ ] Red confirmado
- [ ] Commit `T-014: TDD-Test auth.ts (red)`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-015: TDD-Impl — src/webhook/auth.ts

| Campo | Valor |
|---|---|
| **Sprint** | S-1 |
| **Camada** | Parte A |
| **Tipo** | TDD-Impl |
| **Depende de** | T-014 |
| **Estimativa** | ~30min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/webhook/auth.ts`

### Critérios de aceite
- [ ] Todos os 8 testes de T-014 passam
- [ ] `pnpm test` 100% verde
- [ ] `pnpm lint` sem erros

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-015 — TDD-Impl auth.ts
SPRINT: S-1 | TIPO: TDD-Impl

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9
2. docs/specs/01 §7 (bloco auth.test.ts — para entender o comportamento esperado)
3. docs/specs/01 §8 (regras: fail closed, allowlist CSV)

OBJETIVO:
Implementar src/webhook/auth.ts para que todos os 8 testes de T-014 passem.

ESCOPO:
- validateTelegramSecret(request: Request): { ok: true } | { ok: false; status: 401 }
- isUserAllowed(telegramUserId: string): boolean
- Fail closed: secret vazio = 401; allowlist vazia = false

ARQUIVOS PERMITIDOS: src/webhook/auth.ts
ARQUIVOS PROIBIDOS: tests/webhook/auth.test.ts, tudo mais

CRITÉRIOS DE ACEITE:
- [ ] 8 testes passam (green)
- [ ] pnpm test 100% verde
- [ ] pnpm lint sem erros

DEFINIÇÃO DE PRONTO:
1. Reporte src/webhook/auth.ts criado, output pnpm test verde. NÃO faça commit. Pare.
```

### Checklist de fechamento
- [ ] Critérios verificados
- [ ] Commit `T-015: TDD-Impl auth.ts`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-016: TDD-Test — src/webhook/telegram-payload.ts (testes falhando)

| Campo | Valor |
|---|---|
| **Sprint** | S-1 |
| **Camada** | Parte A |
| **Tipo** | TDD-Test |
| **Depende de** | T-013 |
| **Estimativa** | ~20min |
| **Pode rodar em paralelo com** | T-030 a T-037 |

### Arquivos permitidos para criar/editar
- `tests/webhook/telegram-payload.test.ts`

### Critérios de aceite
- [ ] Testes para: update de texto válido passa schema, update de voz válido passa, campos obrigatórios ausentes rejeitados, update desconhecido é aceito com campos opcionais
- [ ] `pnpm test tests/webhook/telegram-payload.test.ts` falha (red)

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-016 — TDD-Test telegram-payload.ts
SPRINT: S-1 | TIPO: TDD-Test

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9
2. docs/specs/01 §4 (arquivo telegram-payload.ts — propósito)

OBJETIVO:
Escrever testes para o schema Zod do payload de update do Telegram. Os testes DEVEM FALHAR.

ESCOPO:
- Criar tests/webhook/telegram-payload.test.ts
- Testar com payloads reais do Telegram: { update_id, message: { message_id, from, chat, date, text } }
- Verificar que campos obrigatórios ausentes rejeitam
- Importar de src/webhook/telegram-payload (não existe — red)

ARQUIVOS PERMITIDOS: tests/webhook/telegram-payload.test.ts
ARQUIVOS PROIBIDOS: src/webhook/telegram-payload.ts, tudo mais

CRITÉRIOS DE ACEITE:
- [ ] Ao menos 4 testes com assertions concretas
- [ ] pnpm test tests/webhook/telegram-payload.test.ts falha (red)

DEFINIÇÃO DE PRONTO:
1. Reporte testes e output red. NÃO faça commit. Pare.
```

### Checklist de fechamento
- [ ] Red confirmado
- [ ] Commit `T-016: TDD-Test telegram-payload.ts (red)`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-017: TDD-Impl — src/webhook/telegram-payload.ts

| Campo | Valor |
|---|---|
| **Sprint** | S-1 |
| **Camada** | Parte A |
| **Tipo** | TDD-Impl |
| **Depende de** | T-016 |
| **Estimativa** | ~20min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/webhook/telegram-payload.ts`

### Critérios de aceite
- [ ] Todos os testes de T-016 passam
- [ ] `pnpm test` 100% verde, `pnpm lint` sem erros

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-017 — TDD-Impl telegram-payload.ts
SPRINT: S-1 | TIPO: TDD-Impl

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9
2. docs/specs/01 §4 (arquivo telegram-payload.ts)

OBJETIVO:
Implementar schema Zod do Update do Telegram para que todos os testes de T-016 passem.

ESCOPO:
- src/webhook/telegram-payload.ts: schema Zod para TelegramUpdate (message.text, message.voice, message.photo, message.document, campos de remetente e chat)
- Exportar schema parseado e tipo TypeScript inferido

ARQUIVOS PERMITIDOS: src/webhook/telegram-payload.ts
ARQUIVOS PROIBIDOS: tests/webhook/telegram-payload.test.ts, tudo mais

CRITÉRIOS DE ACEITE:
- [ ] Testes de T-016 passam
- [ ] pnpm test 100% verde, pnpm lint OK

DEFINIÇÃO DE PRONTO: Reporte arquivo criado e output green. NÃO faça commit. Pare.
```

### Checklist de fechamento
- [ ] Critérios verificados
- [ ] Commit `T-017: TDD-Impl telegram-payload.ts`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-018: TDD-Test — src/webhook/normalize.ts (testes falhando)

| Campo | Valor |
|---|---|
| **Sprint** | S-1 |
| **Camada** | Parte A |
| **Tipo** | TDD-Test |
| **Depende de** | T-017 |
| **Estimativa** | ~30min |
| **Pode rodar em paralelo com** | T-032 a T-037 |

### Arquivos permitidos para criar/editar
- `tests/webhook/normalize.test.ts`

### Critérios de aceite
- [ ] Contém os 8 `it()` exatos de docs/specs/01 §7 (bloco `normalize.test.ts`)
- [ ] `pnpm test tests/webhook/normalize.test.ts` falha (red)

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-018 — TDD-Test normalize.ts
SPRINT: S-1 | TIPO: TDD-Test

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9
2. docs/specs/01 §7 (bloco tests/webhook/normalize.test.ts — 8 it() exatos)

OBJETIVO:
Escrever tests/webhook/normalize.test.ts com os 8 testes de docs/specs/01 §7. DEVEM FALHAR.

ARQUIVOS PERMITIDOS: tests/webhook/normalize.test.ts
ARQUIVOS PROIBIDOS: src/webhook/normalize.ts, tudo mais

CRITÉRIOS DE ACEITE:
- [ ] 8 it() de docs/specs/01 §7 presentes com assertions concretas
- [ ] pnpm test tests/webhook/normalize.test.ts falha (red)

DEFINIÇÃO DE PRONTO: Reporte 8 testes e output red. NÃO faça commit. Pare.
```

### Checklist de fechamento
- [ ] Red confirmado
- [ ] Commit `T-018: TDD-Test normalize.ts (red)`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-019: TDD-Impl — src/webhook/normalize.ts

| Campo | Valor |
|---|---|
| **Sprint** | S-1 |
| **Camada** | Parte A |
| **Tipo** | TDD-Impl |
| **Depende de** | T-018 |
| **Estimativa** | ~30min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/webhook/normalize.ts`

### Critérios de aceite
- [ ] Todos os 8 testes de T-018 passam
- [ ] `pnpm test` 100% verde, `pnpm lint` OK

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-019 — TDD-Impl normalize.ts
SPRINT: S-1 | TIPO: TDD-Impl

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9
2. docs/specs/01 §7 (bloco normalize.test.ts — comportamento esperado)

OBJETIVO:
Implementar normalizeTelegramUpdate que extrai messageType, normalizedText, chatId, telegramMessageId do payload do Telegram.

ARQUIVOS PERMITIDOS: src/webhook/normalize.ts
ARQUIVOS PROIBIDOS: tests/webhook/normalize.test.ts, tudo mais

CRITÉRIOS DE ACEITE:
- [ ] 8 testes de T-018 passam, pnpm test 100% verde, pnpm lint OK

DEFINIÇÃO DE PRONTO: Reporte arquivo e output green. NÃO faça commit. Pare.
```

### Checklist de fechamento
- [ ] Critérios verificados
- [ ] Commit `T-019: TDD-Impl normalize.ts`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-020: TDD-Test — src/webhook/reply.ts (testes falhando)

| Campo | Valor |
|---|---|
| **Sprint** | S-1 |
| **Camada** | Parte A |
| **Tipo** | TDD-Test |
| **Depende de** | T-013 |
| **Estimativa** | ~20min |
| **Pode rodar em paralelo com** | T-032 a T-037 |

### Arquivos permitidos para criar/editar
- `tests/webhook/reply.test.ts`

### Critérios de aceite
- [ ] Testes de: sendMessage chama fetch com URL correta, payload correto, retorna ok em 200, lança em erro HTTP, usa vi.spyOn(globalThis, 'fetch') para mock
- [ ] `pnpm test tests/webhook/reply.test.ts` falha (red)

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-020 — TDD-Test reply.ts
SPRINT: S-1 | TIPO: TDD-Test

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9
2. docs/specs/01 §8 (regra: mock fetch com vi.spyOn(globalThis, 'fetch'), não usar MSW)

OBJETIVO:
Escrever testes para sendMessage do Telegram (cliente HTTP). DEVEM FALHAR.

ESCOPO:
- Usar vi.spyOn(globalThis, 'fetch') para mockar fetch
- Testar: URL correta, body correto, retorno ok, erro HTTP lança exceção
- Importar de src/webhook/reply (não existe — red)

ARQUIVOS PERMITIDOS: tests/webhook/reply.test.ts
ARQUIVOS PROIBIDOS: src/webhook/reply.ts, tudo mais

CRITÉRIOS DE ACEITE:
- [ ] Ao menos 4 testes com vi.spyOn
- [ ] pnpm test tests/webhook/reply.test.ts falha (red)

DEFINIÇÃO DE PRONTO: Reporte testes e output red. NÃO faça commit. Pare.
```

### Checklist de fechamento
- [ ] Red confirmado
- [ ] Commit `T-020: TDD-Test reply.ts (red)`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-021: TDD-Impl — src/webhook/reply.ts

| Campo | Valor |
|---|---|
| **Sprint** | S-1 |
| **Camada** | Parte A |
| **Tipo** | TDD-Impl |
| **Depende de** | T-020 |
| **Estimativa** | ~20min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/webhook/reply.ts`

### Critérios de aceite
- [ ] Todos os testes de T-020 passam, `pnpm test` 100% verde, `pnpm lint` OK

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-021 — TDD-Impl reply.ts
SPRINT: S-1 | TIPO: TDD-Impl

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9
2. docs/specs/01 §8 (apenas sendMessage via fetch)

OBJETIVO:
Implementar sendMessage(chatId, text) que chama a API do Telegram. Apenas fetch, sem SDK.

ESCOPO:
- POST para https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage
- Body: { chat_id, text }
- Lançar erro se resposta não for ok

ARQUIVOS PERMITIDOS: src/webhook/reply.ts
ARQUIVOS PROIBIDOS: tests/webhook/reply.test.ts, tudo mais

CRITÉRIOS DE ACEITE: Testes de T-020 passam, pnpm test verde, lint OK.

DEFINIÇÃO DE PRONTO: Reporte arquivo e output green. NÃO faça commit. Pare.
```

### Checklist de fechamento
- [ ] Critérios verificados
- [ ] Commit `T-021: TDD-Impl reply.ts`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-022: TDD-Test — POST /api/webhooks/telegram (testes falhando)

| Campo | Valor |
|---|---|
| **Sprint** | S-1 |
| **Camada** | Parte A |
| **Tipo** | TDD-Test |
| **Depende de** | T-011, T-015, T-019, T-021, T-004, T-003 |
| **Estimativa** | ~1h |
| **Pode rodar em paralelo com** | T-038 a T-045 |

### Arquivos permitidos para criar/editar
- `tests/webhook/route.test.ts`

### Arquivos proibidos de tocar
- `src/app/api/webhooks/telegram/route.ts`, todo o resto

### Critérios de aceite
- [ ] Contém os 14 `it()` exatos de docs/specs/01 §7 (bloco `route.test.ts`)
- [ ] Usa banco de teste real (TEST_DATABASE_URL)
- [ ] `pnpm test tests/webhook/route.test.ts` falha (red)

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-022 — TDD-Test POST /api/webhooks/telegram
SPRINT: S-1 | TIPO: TDD-Test

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9
2. docs/specs/01 §7 (bloco route.test.ts — 14 it() exatos)
3. docs/specs/01 §8 (regras: sempre 200 ao Telegram exceto 401 de auth; persistir MessageLog antes de processMessage)

OBJETIVO:
Escrever tests/webhook/route.test.ts com os 14 testes de docs/specs/01 §7. Os testes DEVEM FALHAR. Usa banco de teste real.

ESCOPO:
- Criar tests/webhook/route.test.ts
- Usar o prisma exportado de tests/setup.ts para verificar estado do banco
- Mockar fetch global (para o reply.ts não chamar Telegram de verdade)
- Importar handler de src/app/api/webhooks/telegram/route (não existe — red)
- Os 14 it() de docs/specs/01 §7 com assertions concretas

ARQUIVOS PERMITIDOS: tests/webhook/route.test.ts
ARQUIVOS PROIBIDOS: src/app/api/webhooks/telegram/route.ts, tudo mais

CRITÉRIOS DE ACEITE:
- [ ] 14 it() de docs/specs/01 §7 presentes com assertions concretas
- [ ] pnpm test tests/webhook/route.test.ts falha (red)

DEFINIÇÃO DE PRONTO: Reporte 14 testes e output red. NÃO faça commit. Pare.
```

### Checklist de fechamento
- [ ] Red confirmado
- [ ] Commit `T-022: TDD-Test route.ts (red)`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-023: TDD-Impl — src/app/api/webhooks/telegram/route.ts

| Campo | Valor |
|---|---|
| **Sprint** | S-1 |
| **Camada** | Parte A |
| **Tipo** | TDD-Impl |
| **Depende de** | T-022 |
| **Estimativa** | ~1.5h |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/app/api/webhooks/telegram/route.ts`

### Critérios de aceite
- [ ] Todos os 14 testes de T-022 passam
- [ ] `pnpm test` 100% verde, `pnpm lint` OK

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-023 — TDD-Impl route.ts
SPRINT: S-1 | TIPO: TDD-Impl

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9 (especialmente R-5, R-9)
2. docs/specs/01 §7 (bloco route.test.ts — comportamento esperado)
3. docs/specs/01 §8 (INTEIRO — todas as regras não-óbvias)

OBJETIVO:
Implementar a rota POST que orquestra: validação de secret, allowlist, persistência de MessageLog, criação de User, chamada ao processMessage (stub), reply ao Telegram.

ESCOPO:
- Importar: auth.ts, normalize.ts, reply.ts, prisma.ts, logger.ts, stub.ts, telegram-payload.ts, env.ts
- Lógica: parse payload → validar secret (401 se falhar) → verificar allowlist (200 silencioso se não autorizado) → persistir MessageLog → find-or-create User → chamar stubProcessor.processMessage → sendMessage com o reply → retornar 200
- Persistir MessageLog ANTES de chamar processMessage
- Idempotência via @@unique([chatId, telegramMessageId]) — tratar UniqueConstraintError
- Retornar 200 mesmo quando processMessage lança (logar erro)

ARQUIVOS PERMITIDOS: src/app/api/webhooks/telegram/route.ts
ARQUIVOS PROIBIDOS: tests/webhook/route.test.ts, src/ai/**, src/financial/**, tudo mais

CRITÉRIOS DE ACEITE:
- [ ] 14 testes de T-022 passam
- [ ] pnpm test 100% verde
- [ ] pnpm lint OK

DEFINIÇÃO DE PRONTO: Reporte arquivo criado e output green. NÃO faça commit. Pare.
```

### Checklist de fechamento
- [ ] Critérios verificados
- [ ] Commit `T-023: TDD-Impl route.ts webhook`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-024: tests/integration/webhook-end-to-end.test.ts

| Campo | Valor |
|---|---|
| **Sprint** | S-1 |
| **Camada** | Parte A |
| **Tipo** | TDD-Test |
| **Depende de** | T-023 |
| **Estimativa** | ~45min |
| **Pode rodar em paralelo com** | T-046 a T-050 |

### Arquivos permitidos para criar/editar
- `tests/integration/webhook-end-to-end.test.ts`

### Critérios de aceite
- [ ] Contém os 2 `it()` de docs/specs/01 §7 (bloco `webhook-end-to-end.test.ts`)
- [ ] Testes passam (green) — o handler já existe após T-023
- [ ] `pnpm test` 100% verde

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-024 — tests/integration/webhook-end-to-end.test.ts
SPRINT: S-1 | TIPO: TDD-Test

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9
2. docs/specs/01 §7 (bloco webhook-end-to-end.test.ts — 2 it() exatos)

OBJETIVO:
Criar teste de integração end-to-end que exercita o fluxo completo: POST webhook → MessageLog persistido → stub responde → reply enviado. Os testes DEVEM PASSAR (o handler já existe).

ESCOPO:
- Criar tests/integration/webhook-end-to-end.test.ts
- Usar banco de teste real
- Mockar fetch para o sendMessage do Telegram
- Verificar: MessageLog existe no banco após POST, log contém userId e messageLogId

ARQUIVOS PERMITIDOS: tests/integration/webhook-end-to-end.test.ts
ARQUIVOS PROIBIDOS: qualquer arquivo de src/, tudo mais

CRITÉRIOS DE ACEITE:
- [ ] 2 it() de docs/specs/01 §7 presentes e passando (green)
- [ ] pnpm test 100% verde

DEFINIÇÃO DE PRONTO: Reporte testes e output green. NÃO faça commit. Pare.
```

### Checklist de fechamento
- [ ] Critérios verificados
- [ ] Commit `T-024: integration webhook end-to-end`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-025: Manual — Criar bot no Telegram + configurar .env.local

| Campo | Valor |
|---|---|
| **Sprint** | S-1 |
| **Camada** | Manual |
| **Tipo** | Manual |
| **Depende de** | T-007 |
| **Estimativa** | ~10min |
| **Pode rodar em paralelo com** | qualquer task de código |

### Arquivos permitidos para criar/editar
- `.env.local` (humano preenche manualmente — não commitado)

### Critérios de aceite
- [ ] Bot criado no @BotFather com nome pessoal
- [ ] `TELEGRAM_BOT_TOKEN` em `.env.local`
- [ ] `TELEGRAM_WEBHOOK_SECRET` gerado (≥32 chars) em `.env.local`
- [ ] `TELEGRAM_ALLOWED_USER_IDS` com o seu telegramUserId em `.env.local`
- [ ] `.env.local` está no `.gitignore`

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-025 — Manual: criar bot Telegram (Manual)
SPRINT: S-1 | TIPO: Manual

ESTA TASK É MANUAL. Gere instruções passo a passo para o humano executar. NÃO execute comandos você mesmo.

GERE PARA O HUMANO:
1. Abrir Telegram e falar com @BotFather → /newbot → escolher nome → copiar o token
2. Gerar WEBHOOK_SECRET: openssl rand -hex 32
3. Descobrir próprio telegramUserId: falar com @userinfobot
4. Criar .env.local na raiz do projeto e preencher:
   TELEGRAM_BOT_TOKEN=<token do BotFather>
   TELEGRAM_WEBHOOK_SECRET=<gerado acima>
   TELEGRAM_ALLOWED_USER_IDS=<seu telegramUserId>
5. Confirmar que .env.local está no .gitignore

Formate as instruções de forma clara e numerada. Pare após gerar as instruções.
```

### Checklist de fechamento
- [ ] Humano confirmou execução de todos os passos
- [ ] `.env.local` existe com os 3 campos
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-026: Manual — Configurar túnel Tailscale Funnel

| Campo | Valor |
|---|---|
| **Sprint** | S-1 |
| **Camada** | Manual |
| **Tipo** | Manual |
| **Depende de** | T-009 |
| **Estimativa** | ~20min |
| **Pode rodar em paralelo com** | qualquer task de código |

### Critérios de aceite
- [ ] Tailscale instalado e autenticado
- [ ] `tailscale funnel 3000` expõe a porta 3000 publicamente
- [ ] URL pública do funnel anotada (será usada em T-027)
- [ ] `GET <url-publica>/api/health` retorna 200

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-026 — Manual: configurar túnel Tailscale Funnel
SPRINT: S-1 | TIPO: Manual

ESTA TASK É MANUAL. Gere instruções passo a passo. NÃO execute comandos você mesmo.

GERE PARA O HUMANO:
1. Instalar Tailscale se não instalado: brew install tailscale
2. Autenticar: tailscale up
3. Habilitar Funnel: tailscale funnel 3000
4. Copiar a URL pública exibida (formato: https://<hostname>.ts.net)
5. Com pnpm dev rodando, testar: curl <url-publica>/api/health → deve retornar {"status":"ok"}
6. Anotar a URL pública para T-027

Formate as instruções de forma clara. Pare após gerar.
```

### Checklist de fechamento
- [ ] Humano confirmou execução
- [ ] URL pública anotada nas Notas de execução
- [ ] Esta task marcada `[x]`

### Notas de execução
URL pública do funnel: ___________

---

## [ ] T-027: Manual — Configurar webhook no Telegram

| Campo | Valor |
|---|---|
| **Sprint** | S-1 |
| **Camada** | Manual |
| **Tipo** | Manual |
| **Depende de** | T-025, T-026 |
| **Estimativa** | ~10min |
| **Pode rodar em paralelo com** | qualquer task de código |

### Critérios de aceite
- [ ] Webhook registrado no Telegram com URL e secret_token
- [ ] Mensagem enviada ao bot aparece no `MessageLog` do banco

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-027 — Manual: configurar webhook no Telegram
SPRINT: S-1 | TIPO: Manual

ESTA TASK É MANUAL. Gere o comando exato para o humano rodar. NÃO execute você mesmo.

GERE PARA O HUMANO:
1. Com pnpm dev rodando e túnel ativo (T-026), rodar:

curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -d "url=<URL_PUBLICA>/api/webhooks/telegram" \
  -d "secret_token=<WEBHOOK_SECRET>"

2. Verificar resposta: { "ok": true, "description": "Webhook was set" }
3. Enviar mensagem de teste ao bot no Telegram
4. Verificar no banco: SELECT * FROM "MessageLog" ORDER BY "createdAt" DESC LIMIT 1;

Usar os valores de .env.local para substituir os placeholders. Pare após gerar.
```

### Checklist de fechamento
- [ ] Humano confirmou webhook configurado
- [ ] Mensagem de teste apareceu no MessageLog
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-028: README Parte A

| Campo | Valor |
|---|---|
| **Sprint** | S-1 |
| **Camada** | Parte A |
| **Tipo** | Doc |
| **Depende de** | T-024 |
| **Estimativa** | ~30min |
| **Pode rodar em paralelo com** | T-025, T-026, T-027 |

### Arquivos permitidos para criar/editar
- `README.md`

### Critérios de aceite
- [ ] Documenta: como subir Postgres local, como rodar migrations, como criar bot no BotFather, como configurar túnel, como setar webhook com secret
- [ ] Documenta: como rodar `pnpm test` e `pnpm dev`

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-028 — README Parte A
SPRINT: S-1 | TIPO: Doc

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9
2. docs/specs/01 §9 (Critérios de aceite — último item sobre README)

OBJETIVO:
Criar README.md documentando o setup completo da Parte A.

SEÇÕES OBRIGATÓRIAS:
- Visão geral do projeto
- Pré-requisitos (Node 20, pnpm, PostgreSQL 16, Tailscale)
- Setup do banco (criar botfinancas e botfinancas_test, rodar migrations)
- Variáveis de ambiente (.env.local a partir de .env.example)
- Criar bot no BotFather
- Configurar túnel Tailscale Funnel
- Configurar webhook com secret_token
- Como rodar: pnpm dev, pnpm test
- Segurança: o que NÃO fazer (não commitar .env.local, não expor dashboard)

ARQUIVOS PERMITIDOS: README.md
ARQUIVOS PROIBIDOS: tudo mais

CRITÉRIOS DE ACEITE: README.md com todas as seções acima.

DEFINIÇÃO DE PRONTO: Reporte seções criadas. NÃO faça commit. Pare.
```

### Checklist de fechamento
- [ ] Critérios verificados
- [ ] Commit `T-028: README Parte A`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-029: Review S-1

| Campo | Valor |
|---|---|
| **Sprint** | S-1 |
| **Camada** | Parte A |
| **Tipo** | Review |
| **Depende de** | T-024, T-025, T-026, T-027, T-028 |
| **Estimativa** | ~45min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- Nenhum (apenas leitura)

### Critérios de aceite
- [ ] `pnpm test` 100% verde (todos os testes de S-1)
- [ ] `pnpm lint` sem erros
- [ ] `GET /api/health` retorna 200
- [ ] Webhook real entrega mensagem → stub responde "Mensagem recebida..."
- [ ] `MessageLog` aparece no banco após mensagem real
- [ ] POST sem secret → 401
- [ ] `src/ai/` não foi tocado

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-029 — Review S-1
SPRINT: S-1 | TIPO: Review

LEITURA OBRIGATÓRIA:
1. docs/plan.md §9, §10, §11
2. docs/specs/01 §9 (Critérios de aceite da sprint inteira)

OBJETIVO:
Validar que todos os entregáveis de S-1 estão corretos.

ESCOPO:
- Executar: pnpm test (reportar resultado por arquivo de teste), pnpm lint
- Verificar: existência e conteúdo de src/webhook/{auth,normalize,reply,telegram-payload}.ts, src/lib/{env,prisma,logger}.ts, src/processor/stub.ts, src/app/api/webhooks/telegram/route.ts
- Verificar: src/ai/ e src/financial/ NÃO existem ou estão vazios

ARQUIVOS PERMITIDOS: nenhum (read-only)
ARQUIVOS PROIBIDOS: tudo

DEFINIÇÃO DE PRONTO:
1. Reportar checklist com verde/vermelho por critério.
2. Se tudo verde: "S-1 aprovada."
3. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] Todos os critérios verdes
- [ ] Smoke test manual: mensagem real → reply recebido
- [ ] Commit `T-029: review S-1 aprovada`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)
test

---

## Sprint S-2 — Parte B: Pipeline IA

---

## [ ] T-030: [TDD-Test] extractJson — isolar bloco JSON de resposta bruta do LLM

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Test |
| **Depende de** | T-008 |
| **Estimativa** | ~20min |
| **Pode rodar em paralelo com** | S-1 inteiro |

### Arquivos permitidos para criar/editar
- `src/ai/extract-json.test.ts` (criar)

### Arquivos proibidos de tocar
- `src/ai/extract-json.ts` (ainda não existe — não criar)
- Qualquer arquivo de S-1

### Critérios de aceite
- [ ] Arquivo de teste criado com casos: JSON válido inline, JSON entre texto, sem JSON, JSON malformado
- [ ] `pnpm test extract-json` falha (implementação não existe) — vermelho confirmado
- [ ] Tipos importados de `shared/contract.ts`

### Prompt para Opus
```
TASK: T-030 TDD-Test extractJson
ARQUIVO: src/ai/extract-json.test.ts (criar)

FUNÇÃO A TESTAR: extractJson(rawText: string): Record<string, unknown> | null
- Recebe texto bruto do LLM
- Extrai o primeiro bloco JSON válido encontrado (pode vir entre texto, markdown, etc.)
- Retorna null se não encontrar JSON válido

CASOS DE TESTE OBRIGATÓRIOS:
1. rawText é JSON puro → retorna o objeto
2. rawText tem JSON entre texto livre → extrai o JSON
3. rawText tem JSON entre ```json ... ``` → extrai o JSON
4. rawText não tem JSON → retorna null
5. rawText tem JSON malformado → retorna null

INSTRUÇÕES:
- Usar vitest
- NÃO criar src/ai/extract-json.ts
- Confirmar que pnpm test extract-json falha ao final

ARQUIVOS PERMITIDOS: src/ai/extract-json.test.ts
ARQUIVOS PROIBIDOS: src/ai/extract-json.ts e todo o resto

DEFINIÇÃO DE PRONTO:
Reportar: casos escritos, resultado do teste (deve falhar). NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] Teste escrito com todos os casos
- [ ] Vermelho confirmado (implementação ausente)
- [ ] Commit `T-030: test extractJson vermelho`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-031: [TDD-Impl] extractJson — implementação

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Impl |
| **Depende de** | T-030 |
| **Estimativa** | ~25min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/ai/extract-json.ts` (criar)

### Arquivos proibidos de tocar
- `src/ai/extract-json.test.ts`
- Qualquer arquivo de S-1

### Critérios de aceite
- [ ] `pnpm test extract-json` verde (todos os casos passam)
- [ ] Sem `any` explícito; retorna `Record<string, unknown> | null`
- [ ] Regex ou parser robusto para extrair JSON de texto bruto

### Prompt para Opus
```
TASK: T-031 TDD-Impl extractJson
ARQUIVO: src/ai/extract-json.ts (criar)

Implementar extractJson(rawText: string): Record<string, unknown> | null
Os testes estão em src/ai/extract-json.test.ts — faça-os passar.

ESTRATÉGIA SUGERIDA:
1. Tentar JSON.parse(rawText.trim()) diretamente
2. Se falhar, tentar extrair bloco ```json...``` com regex
3. Se falhar, tentar encontrar { ... } com regex guloso
4. Se tudo falhar, retornar null

INSTRUÇÕES:
- Sem `any` explícito
- pnpm test extract-json deve ficar verde

ARQUIVOS PERMITIDOS: src/ai/extract-json.ts
ARQUIVOS PROIBIDOS: tudo que já existe

DEFINIÇÃO DE PRONTO:
Reportar resultado do teste (deve ser verde). NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] `pnpm test extract-json` verde
- [ ] `pnpm lint` limpo
- [ ] Commit `T-031: impl extractJson verde`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-032: [TDD-Test] schemas.ts — validação Zod dos campos extraídos

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Test |
| **Depende de** | T-008 |
| **Estimativa** | ~25min |
| **Pode rodar em paralelo com** | T-030, T-031 |

### Arquivos permitidos para criar/editar
- `src/ai/schemas.test.ts` (criar)

### Arquivos proibidos de tocar
- `src/ai/schemas.ts` (não existe ainda)

### Critérios de aceite
- [ ] Testa schema para `Transaction` extraída (type, amount, description, date, currency, category, confidence)
- [ ] Testa casos inválidos: amount negativo, type inválido, date malformada
- [ ] Vermelho confirmado

### Prompt para Opus
```
TASK: T-032 TDD-Test schemas.ts
ARQUIVO: src/ai/schemas.test.ts (criar)

SCHEMA A VALIDAR (Zod): LlmTransactionSchema
Campos esperados (baseado em docs/specs/02 §4):
- type: "expense" | "income" | "transfer"
- amount: number positivo
- description: string (min 1)
- date: string formato ISO 8601
- currency: string (default "BRL")
- category: string opcional
- confidence: number entre 0 e 1
- rawResponse: string (resposta bruta do LLM)

CASOS DE TESTE OBRIGATÓRIOS:
1. Objeto válido completo → parse OK
2. Objeto válido mínimo (sem campos opcionais) → parse OK com defaults
3. amount negativo → erro Zod
4. type inválido ("payment") → erro Zod
5. confidence > 1 → erro Zod
6. date malformada → erro Zod

INSTRUÇÕES:
- NÃO criar src/ai/schemas.ts
- Confirmar vermelho ao final

ARQUIVOS PERMITIDOS: src/ai/schemas.test.ts
ARQUIVOS PROIBIDOS: src/ai/schemas.ts e todo o resto

DEFINIÇÃO DE PRONTO:
Reportar casos escritos e vermelho confirmado. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] Teste escrito com todos os casos
- [ ] Vermelho confirmado
- [ ] Commit `T-032: test schemas vermelho`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-033: [TDD-Impl] schemas.ts — implementação Zod

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Impl |
| **Depende de** | T-032 |
| **Estimativa** | ~20min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/ai/schemas.ts` (criar)

### Arquivos proibidos de tocar
- `src/ai/schemas.test.ts`

### Critérios de aceite
- [ ] `pnpm test schemas` verde
- [ ] Schema exporta `LlmTransactionSchema` e tipo inferido `LlmTransaction`
- [ ] Sem `any`

### Prompt para Opus
```
TASK: T-033 TDD-Impl schemas.ts
ARQUIVO: src/ai/schemas.ts (criar)

Implementar LlmTransactionSchema (Zod) para fazer passar src/ai/schemas.test.ts.

INSTRUÇÕES:
- Exportar LlmTransactionSchema e type LlmTransaction = z.infer<typeof LlmTransactionSchema>
- currency default "BRL", category opcional
- confidence: z.number().min(0).max(1)
- date: z.string() com refinement ISO 8601 (usar Date.parse ou regex)
- pnpm test schemas deve ficar verde

ARQUIVOS PERMITIDOS: src/ai/schemas.ts
ARQUIVOS PROIBIDOS: tudo que já existe

DEFINIÇÃO DE PRONTO:
Reportar verde. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] `pnpm test schemas` verde
- [ ] `pnpm lint` limpo
- [ ] Commit `T-033: impl schemas verde`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-034: [TDD-Test] sanitize.ts — limpar e normalizar campos extraídos

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Test |
| **Depende de** | T-033 |
| **Estimativa** | ~20min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/ai/sanitize.test.ts` (criar)

### Arquivos proibidos de tocar
- `src/ai/sanitize.ts` (não existe ainda)

### Critérios de aceite
- [ ] Testa normalização de amount (string → number, vírgula → ponto)
- [ ] Testa normalização de date (formatos locais → ISO)
- [ ] Testa trim de strings
- [ ] Vermelho confirmado

### Prompt para Opus
```
TASK: T-034 TDD-Test sanitize.ts
ARQUIVO: src/ai/sanitize.test.ts (criar)

FUNÇÃO A TESTAR: sanitize(raw: Record<string, unknown>): Record<string, unknown>
- Normaliza campos antes da validação Zod
- Converte amount de string para number se necessário
- Converte vírgula para ponto em valores numéricos ("1.500,00" → 1500.00)
- Faz trim em campos string
- Normaliza date para ISO 8601 se vier em formato local (dd/mm/yyyy → yyyy-mm-dd)

CASOS DE TESTE:
1. amount como string "150.00" → number 150
2. amount com vírgula "1.500,50" → number 1500.50
3. description com espaços extra "  compra  " → "compra"
4. date "25/12/2024" → "2024-12-25"
5. date já em ISO → mantém igual
6. campos já corretos → retorna sem alteração

INSTRUÇÕES:
- NÃO criar src/ai/sanitize.ts
- Vermelho ao final

ARQUIVOS PERMITIDOS: src/ai/sanitize.test.ts
ARQUIVOS PROIBIDOS: src/ai/sanitize.ts e todo o resto

DEFINIÇÃO DE PRONTO:
Reportar casos e vermelho. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] Teste com todos os casos
- [ ] Vermelho confirmado
- [ ] Commit `T-034: test sanitize vermelho`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-035: [TDD-Impl] sanitize.ts — implementação

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Impl |
| **Depende de** | T-034 |
| **Estimativa** | ~20min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/ai/sanitize.ts` (criar)

### Arquivos proibidos de tocar
- `src/ai/sanitize.test.ts`

### Critérios de aceite
- [ ] `pnpm test sanitize` verde
- [ ] Sem `any`; entrada e saída tipadas como `Record<string, unknown>`

### Prompt para Opus
```
TASK: T-035 TDD-Impl sanitize.ts
ARQUIVO: src/ai/sanitize.ts (criar)

Implementar sanitize(raw: Record<string, unknown>): Record<string, unknown>
Fazer passar src/ai/sanitize.test.ts.

INSTRUÇÕES:
- Sem `any`
- pnpm test sanitize verde

ARQUIVOS PERMITIDOS: src/ai/sanitize.ts
ARQUIVOS PROIBIDOS: tudo que já existe

DEFINIÇÃO DE PRONTO:
Reportar verde. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] `pnpm test sanitize` verde
- [ ] `pnpm lint` limpo
- [ ] Commit `T-035: impl sanitize verde`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-036: [TDD-Test] confidence.ts — calcular confiança da extração

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Test |
| **Depende de** | T-033 |
| **Estimativa** | ~20min |
| **Pode rodar em paralelo com** | T-034 |

### Arquivos permitidos para criar/editar
- `src/ai/confidence.test.ts` (criar)

### Arquivos proibidos de tocar
- `src/ai/confidence.ts` (não existe ainda)

### Critérios de aceite
- [ ] Testa score alto quando todos os campos obrigatórios presentes
- [ ] Testa penalidades por campos ausentes (category, date)
- [ ] Score sempre entre 0 e 1
- [ ] Vermelho confirmado

### Prompt para Opus
```
TASK: T-036 TDD-Test confidence.ts
ARQUIVO: src/ai/confidence.test.ts (criar)

FUNÇÃO A TESTAR: calculateConfidence(extracted: Partial<LlmTransaction>): number
- Retorna número entre 0 e 1
- Score base 1.0
- Penalidade -0.2 se category ausente
- Penalidade -0.15 se date ausente
- Penalidade -0.3 se amount ausente
- Penalidade -0.3 se type ausente
- Mínimo 0

CASOS DE TESTE:
1. Todos os campos → 1.0 (ou próximo)
2. Sem category → 0.8
3. Sem date e sem category → 0.65
4. Apenas type e amount → < 0.5
5. Nenhum campo relevante → 0

Importar LlmTransaction de src/ai/schemas.ts

INSTRUÇÕES:
- NÃO criar src/ai/confidence.ts
- Vermelho ao final

ARQUIVOS PERMITIDOS: src/ai/confidence.test.ts
ARQUIVOS PROIBIDOS: src/ai/confidence.ts e todo o resto

DEFINIÇÃO DE PRONTO:
Reportar casos e vermelho. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] Teste com todos os casos
- [ ] Vermelho confirmado
- [ ] Commit `T-036: test confidence vermelho`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-037: [TDD-Impl] confidence.ts — implementação

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Impl |
| **Depende de** | T-036 |
| **Estimativa** | ~15min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/ai/confidence.ts` (criar)

### Arquivos proibidos de tocar
- `src/ai/confidence.test.ts`

### Critérios de aceite
- [ ] `pnpm test confidence` verde
- [ ] Retorna sempre number entre 0 e 1

### Prompt para Opus
```
TASK: T-037 TDD-Impl confidence.ts
ARQUIVO: src/ai/confidence.ts (criar)

Implementar calculateConfidence(extracted: Partial<LlmTransaction>): number
Fazer passar src/ai/confidence.test.ts.

ARQUIVOS PERMITIDOS: src/ai/confidence.ts
ARQUIVOS PROIBIDOS: tudo que já existe

DEFINIÇÃO DE PRONTO:
Reportar verde. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] `pnpm test confidence` verde
- [ ] `pnpm lint` limpo
- [ ] Commit `T-037: impl confidence verde`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-038: [TDD-Test] dates.ts — normalizar datas para UTC/ISO

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Test |
| **Depende de** | T-008 |
| **Estimativa** | ~20min |
| **Pode rodar em paralelo com** | T-030, T-032, T-036 |

### Arquivos permitidos para criar/editar
- `src/ai/dates.test.ts` (criar)

### Arquivos proibidos de tocar
- `src/ai/dates.ts` (não existe ainda)

### Critérios de aceite
- [ ] Testa conversão de formatos regionais para ISO 8601
- [ ] Testa "hoje", "ontem" relativos (mockar Date.now se necessário)
- [ ] Testa data inválida → lança erro ou retorna null
- [ ] Vermelho confirmado

### Prompt para Opus
```
TASK: T-038 TDD-Test dates.ts
ARQUIVO: src/ai/dates.test.ts (criar)

FUNÇÃO A TESTAR: normalizeDate(input: string, referenceDate?: Date): string | null
- Converte diversas representações de data para ISO 8601 (yyyy-mm-dd)
- referenceDate é usada para resolver "hoje", "ontem" etc. (default: new Date())
- Retorna null para entrada não reconhecida

CASOS DE TESTE:
1. "2024-12-25" → "2024-12-25" (já ISO)
2. "25/12/2024" → "2024-12-25"
3. "25-12-2024" → "2024-12-25"
4. "hoje" com referenceDate 2024-12-25 → "2024-12-25"
5. "ontem" com referenceDate 2024-12-25 → "2024-12-24"
6. "xyz inválida" → null

INSTRUÇÕES:
- NÃO criar src/ai/dates.ts
- Vermelho ao final

ARQUIVOS PERMITIDOS: src/ai/dates.test.ts
ARQUIVOS PROIBIDOS: src/ai/dates.ts e todo o resto

DEFINIÇÃO DE PRONTO:
Reportar casos e vermelho. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] Teste com todos os casos
- [ ] Vermelho confirmado
- [ ] Commit `T-038: test dates vermelho`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-039: [TDD-Impl] dates.ts — implementação

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Impl |
| **Depende de** | T-038 |
| **Estimativa** | ~25min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/ai/dates.ts` (criar)

### Arquivos proibidos de tocar
- `src/ai/dates.test.ts`

### Critérios de aceite
- [ ] `pnpm test dates` verde
- [ ] Sem dependências externas de parsing de datas (usar apenas Date nativo ou Temporal API)

### Prompt para Opus
```
TASK: T-039 TDD-Impl dates.ts
ARQUIVO: src/ai/dates.ts (criar)

Implementar normalizeDate(input: string, referenceDate?: Date): string | null
Fazer passar src/ai/dates.test.ts.

INSTRUÇÕES:
- Preferir implementação sem libs externas (Date nativo)
- Se precisar de lib, usar apenas o que já está em package.json
- pnpm test dates verde

ARQUIVOS PERMITIDOS: src/ai/dates.ts
ARQUIVOS PROIBIDOS: tudo que já existe

DEFINIÇÃO DE PRONTO:
Reportar verde. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] `pnpm test dates` verde
- [ ] `pnpm lint` limpo
- [ ] Commit `T-039: impl dates verde`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-040: [TDD-Test] categories.ts — mapear categoria para CategoryEnum (real DB)

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Test |
| **Depende de** | T-008 |
| **Estimativa** | ~25min |
| **Pode rodar em paralelo com** | T-030, T-032, T-038 |

### Arquivos permitidos para criar/editar
- `src/ai/categories.test.ts` (criar)

### Arquivos proibidos de tocar
- `src/ai/categories.ts` (não existe ainda)

### Critérios de aceite
- [ ] Usa banco de dados real (sem mock)
- [ ] Testa mapeamento de string livre para CategoryEnum do Prisma
- [ ] Testa categoria desconhecida → "OTHER" ou null
- [ ] Vermelho confirmado

### Prompt para Opus
```
TASK: T-040 TDD-Test categories.ts
ARQUIVO: src/ai/categories.test.ts (criar)

FUNÇÃO A TESTAR: mapCategory(rawCategory: string): CategoryEnum
- Recebe string livre vinda do LLM ("alimentação", "food", "mercado")
- Retorna o valor mais próximo do enum CategoryEnum do Prisma
- Se não encontrar correspondência → retorna "OTHER"

INSTRUÇÕES:
- Usar banco de dados real (DATABASE_URL do .env.test)
- Seed necessário: garantir que categorias existem no DB
- NÃO criar src/ai/categories.ts
- Vermelho ao final

CASOS DE TESTE:
1. "alimentação" → "FOOD" (ou equivalente no enum)
2. "salário" → "INCOME"
3. "xyz desconhecido" → "OTHER"
4. string vazia → "OTHER"

ARQUIVOS PERMITIDOS: src/ai/categories.test.ts
ARQUIVOS PROIBIDOS: src/ai/categories.ts e todo o resto

DEFINIÇÃO DE PRONTO:
Reportar casos e vermelho. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] Teste com banco real
- [ ] Vermelho confirmado
- [ ] Commit `T-040: test categories vermelho`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-041: [TDD-Impl] categories.ts — implementação

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Impl |
| **Depende de** | T-040 |
| **Estimativa** | ~30min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/ai/categories.ts` (criar)

### Arquivos proibidos de tocar
- `src/ai/categories.test.ts`

### Critérios de aceite
- [ ] `pnpm test categories` verde com banco real
- [ ] Lógica de matching (fuzzy ou keyword) sem dependências pesadas

### Prompt para Opus
```
TASK: T-041 TDD-Impl categories.ts
ARQUIVO: src/ai/categories.ts (criar)

Implementar mapCategory(rawCategory: string): CategoryEnum
Fazer passar src/ai/categories.test.ts com banco real.

ESTRATÉGIA SUGERIDA:
- Mapa de keywords → CategoryEnum (ex: ["alimentação","food","mercado"] → "FOOD")
- toLowerCase + trim antes de comparar
- Default "OTHER"

ARQUIVOS PERMITIDOS: src/ai/categories.ts
ARQUIVOS PROIBIDOS: tudo que já existe

DEFINIÇÃO DE PRONTO:
Reportar verde. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] `pnpm test categories` verde
- [ ] `pnpm lint` limpo
- [ ] Commit `T-041: impl categories verde`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-042: [TDD-Test] service.ts — orquestrar pipeline IA (real DB)

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Test |
| **Depende de** | T-041, T-039, T-037, T-035, T-033, T-031 |
| **Estimativa** | ~35min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/ai/service.test.ts` (criar)

### Arquivos proibidos de tocar
- `src/ai/service.ts` (não existe ainda)

### Critérios de aceite
- [ ] Testa pipeline completa: rawText → LlmTransaction validado
- [ ] Usa banco real para mapCategory
- [ ] Testa caso inválido (JSON inválido do LLM) → erro tipado
- [ ] Vermelho confirmado

### Prompt para Opus
```
TASK: T-042 TDD-Test service.ts
ARQUIVO: src/ai/service.test.ts (criar)

FUNÇÃO A TESTAR: parseAiResponse(rawText: string): Promise<LlmTransaction>
Pipeline:
1. extractJson(rawText) → objeto ou null
2. sanitize(obj) → objeto limpo
3. LlmTransactionSchema.parse(cleaned) → LlmTransaction validado
4. calculateConfidence(result) → atribuir ao campo confidence
5. normalizeDate(result.date) → substituir date
6. mapCategory(result.category) → substituir category
7. Retornar LlmTransaction final

CASOS DE TESTE (usar banco real):
1. rawText com JSON válido e completo → retorna LlmTransaction
2. rawText sem JSON → lança AiParseError
3. rawText com JSON mas campos inválidos → lança ZodError ou AiParseError

INSTRUÇÕES:
- NÃO criar src/ai/service.ts
- Vermelho ao final

ARQUIVOS PERMITIDOS: src/ai/service.test.ts
ARQUIVOS PROIBIDOS: src/ai/service.ts e todo o resto

DEFINIÇÃO DE PRONTO:
Reportar casos e vermelho. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] Teste com pipeline completa
- [ ] Vermelho confirmado
- [ ] Commit `T-042: test service vermelho`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-043: [TDD-Impl] service.ts — implementação

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Impl |
| **Depende de** | T-042 |
| **Estimativa** | ~30min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/ai/service.ts` (criar)

### Arquivos proibidos de tocar
- `src/ai/service.test.ts`

### Critérios de aceite
- [ ] `pnpm test service` verde com banco real
- [ ] Exporta `AiParseError` como classe de erro tipada
- [ ] Sem `any`

### Prompt para Opus
```
TASK: T-043 TDD-Impl service.ts
ARQUIVO: src/ai/service.ts (criar)

Implementar parseAiResponse(rawText: string): Promise<LlmTransaction>
Fazer passar src/ai/service.test.ts.

Exportar também: class AiParseError extends Error {}

ARQUIVOS PERMITIDOS: src/ai/service.ts
ARQUIVOS PROIBIDOS: tudo que já existe

DEFINIÇÃO DE PRONTO:
Reportar verde. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] `pnpm test service` verde
- [ ] `pnpm lint` limpo
- [ ] Commit `T-043: impl service verde`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-044: [TDD-Test] intent.ts — classificar intenção da mensagem

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Test |
| **Depende de** | T-008 |
| **Estimativa** | ~20min |
| **Pode rodar em paralelo com** | T-030, T-032, T-038, T-040 |

### Arquivos permitidos para criar/editar
- `src/ai/intent.test.ts` (criar)

### Arquivos proibidos de tocar
- `src/ai/intent.ts` (não existe ainda)

### Critérios de aceite
- [ ] Testa classificação: "transaction" | "query" | "unknown"
- [ ] Testa frases de despesa, renda, pergunta de saldo, texto irrelevante
- [ ] Vermelho confirmado

### Prompt para Opus
```
TASK: T-044 TDD-Test intent.ts
ARQUIVO: src/ai/intent.test.ts (criar)

FUNÇÃO A TESTAR: classifyIntent(message: string): "transaction" | "query" | "unknown"
- "transaction": mensagem descreve uma despesa, receita ou transferência
- "query": mensagem pergunta sobre saldo, extrato, relatório
- "unknown": qualquer outra coisa

CASOS DE TESTE:
1. "gastei 50 reais no mercado" → "transaction"
2. "recebi meu salário hoje 3000" → "transaction"
3. "qual é meu saldo?" → "query"
4. "me mostra o extrato de dezembro" → "query"
5. "oi tudo bem" → "unknown"
6. "" (string vazia) → "unknown"

INSTRUÇÕES:
- NÃO criar src/ai/intent.ts
- Vermelho ao final

ARQUIVOS PERMITIDOS: src/ai/intent.test.ts
ARQUIVOS PROIBIDOS: src/ai/intent.ts e todo o resto

DEFINIÇÃO DE PRONTO:
Reportar casos e vermelho. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] Teste com todos os casos
- [ ] Vermelho confirmado
- [ ] Commit `T-044: test intent vermelho`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-045: [TDD-Impl] intent.ts — implementação

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Impl |
| **Depende de** | T-044 |
| **Estimativa** | ~20min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/ai/intent.ts` (criar)

### Arquivos proibidos de tocar
- `src/ai/intent.test.ts`

### Critérios de aceite
- [ ] `pnpm test intent` verde
- [ ] Lógica baseada em keywords sem dependências externas

### Prompt para Opus
```
TASK: T-045 TDD-Impl intent.ts
ARQUIVO: src/ai/intent.ts (criar)

Implementar classifyIntent(message: string): "transaction" | "query" | "unknown"
Fazer passar src/ai/intent.test.ts.

ESTRATÉGIA SUGERIDA:
- Lista de keywords para "transaction": gastei, comprei, paguei, recebi, transferi, etc.
- Lista de keywords para "query": saldo, extrato, relatório, quanto, resumo, etc.
- Default: "unknown"

ARQUIVOS PERMITIDOS: src/ai/intent.ts
ARQUIVOS PROIBIDOS: tudo que já existe

DEFINIÇÃO DE PRONTO:
Reportar verde. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] `pnpm test intent` verde
- [ ] `pnpm lint` limpo
- [ ] Commit `T-045: impl intent verde`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-046: Criar prompt template transaction-extraction.v1.md

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | Setup |
| **Depende de** | T-033 (schema definido) |
| **Estimativa** | ~20min |
| **Pode rodar em paralelo com** | T-044 |

### Arquivos permitidos para criar/editar
- `src/ai/prompts/transaction-extraction.v1.md` (criar)

### Arquivos proibidos de tocar
- Qualquer arquivo de teste ou implementação existente

### Critérios de aceite
- [ ] Prompt instrui o LLM a retornar JSON com os campos de LlmTransaction
- [ ] Tem seção de exemplos (few-shot) com expense e income
- [ ] Placeholder `{{USER_MESSAGE}}` para interpolação
- [ ] Escrito em português (instrução ao LLM)

### Prompt para Opus
```
TASK: T-046 Prompt template
ARQUIVO: src/ai/prompts/transaction-extraction.v1.md (criar)

Criar prompt de extração de transação financeira.

REQUISITOS:
- Instrução clara para o LLM retornar APENAS JSON válido
- Campos obrigatórios no JSON: type, amount, description, date, currency, category, confidence
- 2 exemplos few-shot: uma despesa, uma receita
- Placeholder {{USER_MESSAGE}} onde a mensagem do usuário será inserida
- Instruções em português, pois as mensagens dos usuários serão em português

FORMATO JSON ESPERADO (baseado em LlmTransactionSchema):
{
  "type": "expense" | "income" | "transfer",
  "amount": number,
  "description": string,
  "date": "yyyy-mm-dd",
  "currency": "BRL",
  "category": string,
  "confidence": number (0-1)
}

ARQUIVOS PERMITIDOS: src/ai/prompts/transaction-extraction.v1.md
ARQUIVOS PROIBIDOS: tudo que já existe

DEFINIÇÃO DE PRONTO:
Mostrar conteúdo do arquivo criado. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] Arquivo criado com exemplos few-shot
- [ ] Placeholder `{{USER_MESSAGE}}` presente
- [ ] Commit `T-046: prompt transaction-extraction v1`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-047: [TDD-Test] prompt-loader.ts — carregar e interpolar prompt

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Test |
| **Depende de** | T-046 |
| **Estimativa** | ~20min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/ai/prompt-loader.test.ts` (criar)

### Arquivos proibidos de tocar
- `src/ai/prompt-loader.ts` (não existe ainda)

### Critérios de aceite
- [ ] Testa carregamento do arquivo .md
- [ ] Testa interpolação de `{{USER_MESSAGE}}`
- [ ] Testa erro se placeholder ausente no template
- [ ] Vermelho confirmado

### Prompt para Opus
```
TASK: T-047 TDD-Test prompt-loader.ts
ARQUIVO: src/ai/prompt-loader.test.ts (criar)

FUNÇÃO A TESTAR: loadPrompt(templateName: string, vars: Record<string, string>): string
- Carrega src/ai/prompts/{templateName}.md
- Substitui {{CHAVE}} pelos valores em vars
- Lança erro se arquivo não encontrado
- Lança erro se algum placeholder não foi substituído

CASOS DE TESTE:
1. templateName "transaction-extraction.v1", vars com USER_MESSAGE → retorna string com mensagem interpolada
2. templateName inexistente → lança Error
3. vars sem USER_MESSAGE (placeholder presente no template) → lança Error

INSTRUÇÕES:
- NÃO criar src/ai/prompt-loader.ts
- Vermelho ao final

ARQUIVOS PERMITIDOS: src/ai/prompt-loader.test.ts
ARQUIVOS PROIBIDOS: src/ai/prompt-loader.ts e todo o resto

DEFINIÇÃO DE PRONTO:
Reportar casos e vermelho. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] Teste com todos os casos
- [ ] Vermelho confirmado
- [ ] Commit `T-047: test prompt-loader vermelho`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-048: [TDD-Impl] prompt-loader.ts — implementação

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Impl |
| **Depende de** | T-047 |
| **Estimativa** | ~20min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/ai/prompt-loader.ts` (criar)

### Arquivos proibidos de tocar
- `src/ai/prompt-loader.test.ts`

### Critérios de aceite
- [ ] `pnpm test prompt-loader` verde
- [ ] Usa `fs.readFileSync` (sync OK para carregamento de template)

### Prompt para Opus
```
TASK: T-048 TDD-Impl prompt-loader.ts
ARQUIVO: src/ai/prompt-loader.ts (criar)

Implementar loadPrompt(templateName: string, vars: Record<string, string>): string
Fazer passar src/ai/prompt-loader.test.ts.

ARQUIVOS PERMITIDOS: src/ai/prompt-loader.ts
ARQUIVOS PROIBIDOS: tudo que já existe

DEFINIÇÃO DE PRONTO:
Reportar verde. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] `pnpm test prompt-loader` verde
- [ ] `pnpm lint` limpo
- [ ] Commit `T-048: impl prompt-loader verde`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-049: [TDD-Test] llm-client.ts + fake-llm-client.ts — contrato e fake FIFO

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Test |
| **Depende de** | T-048 |
| **Estimativa** | ~30min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/ai/llm-client.test.ts` (criar)
- `src/ai/fake-llm-client.test.ts` (criar)

### Arquivos proibidos de tocar
- `src/ai/llm-client.ts` (não existe ainda)
- `src/ai/fake-llm-client.ts` (não existe ainda)

### Critérios de aceite
- [ ] Define interface `LlmClient` com método `complete(prompt: string): Promise<string>`
- [ ] FakeLlmClient: FIFO de respostas, lança se fila esvazia
- [ ] Testa FakeLlmClient com fixture JSON
- [ ] Vermelho confirmado

### Prompt para Opus
```
TASK: T-049 TDD-Test llm-client + fake
ARQUIVOS: src/ai/llm-client.test.ts, src/ai/fake-llm-client.test.ts (criar ambos)

INTERFACE A DEFINIR:
interface LlmClient {
  complete(prompt: string): Promise<string>
}

FAKE A TESTAR (FakeLlmClient):
- Construtor recebe array de strings (respostas pré-programadas)
- Cada chamada a complete() retorna a próxima da fila (FIFO)
- Se fila vazia, lança Error("FakeLlmClient: fila de respostas esgotada")

FIXTURE: criar shared/fixtures/expense_simple.json com:
{
  "llmRawResponse": "{\"type\":\"expense\",\"amount\":50.00,\"description\":\"mercado\",\"date\":\"2024-12-25\",\"currency\":\"BRL\",\"category\":\"alimentação\",\"confidence\":0.95}"
}

Nos testes usar:
import expenseSimple from '../../shared/fixtures/expense_simple.json' with { type: 'json' }

CASOS DE TESTE fake-llm-client:
1. Fila com 2 respostas → complete() retorna primeira, segunda chamada retorna segunda
2. Fila vazia → complete() lança Error

INSTRUÇÕES:
- NÃO criar src/ai/llm-client.ts nem src/ai/fake-llm-client.ts
- Criar shared/fixtures/expense_simple.json (é permitido)
- Vermelho ao final

ARQUIVOS PERMITIDOS: src/ai/llm-client.test.ts, src/ai/fake-llm-client.test.ts, shared/fixtures/expense_simple.json
ARQUIVOS PROIBIDOS: src/ai/llm-client.ts, src/ai/fake-llm-client.ts e todo o resto

DEFINIÇÃO DE PRONTO:
Reportar casos e vermelho. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] Testes escritos, fixture criada
- [ ] Vermelho confirmado
- [ ] Commit `T-049: test llm-client + fake vermelho`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-050: [TDD-Impl] llm-client.ts + fake-llm-client.ts — implementação

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Impl |
| **Depende de** | T-049 |
| **Estimativa** | ~25min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/ai/llm-client.ts` (criar)
- `src/ai/fake-llm-client.ts` (criar)

### Arquivos proibidos de tocar
- `src/ai/llm-client.test.ts`
- `src/ai/fake-llm-client.test.ts`

### Critérios de aceite
- [ ] `pnpm test llm-client fake-llm-client` verde
- [ ] OllamaLlmClient (implementação real) usa fetch para chamar Ollama local
- [ ] FakeLlmClient implementa interface LlmClient

### Prompt para Opus
```
TASK: T-050 TDD-Impl llm-client + fake
ARQUIVOS: src/ai/llm-client.ts, src/ai/fake-llm-client.ts (criar ambos)

Implementar:
1. Interface LlmClient e classe OllamaLlmClient (usa fetch → http://localhost:11434/api/generate)
2. FakeLlmClient implementando LlmClient com FIFO

Fazer passar src/ai/llm-client.test.ts e src/ai/fake-llm-client.test.ts.

ARQUIVOS PERMITIDOS: src/ai/llm-client.ts, src/ai/fake-llm-client.ts
ARQUIVOS PROIBIDOS: tudo que já existe

DEFINIÇÃO DE PRONTO:
Reportar verde. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] `pnpm test` verde para ambos
- [ ] `pnpm lint` limpo
- [ ] Commit `T-050: impl llm-client + fake verde`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-051: [TDD-Test] processor.ts — processar mensagem completo (real DB + FakeLlm)

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Test |
| **Depende de** | T-050, T-043, T-045 |
| **Estimativa** | ~40min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/financial/processor.test.ts` (criar)

### Arquivos proibidos de tocar
- `src/financial/processor.ts` (não existe ainda)
- `src/processor/stub.ts` (manter intacto)

### Critérios de aceite
- [ ] Usa banco real + FakeLlmClient
- [ ] Testa fluxo completo: mensagem de texto → Transaction criada no DB
- [ ] Testa criação de Transaction com invoiceId → Invoice.totalAmount incrementado atomicamente
- [ ] Testa mensagem não-transacional → retorna resposta informativa
- [ ] Vermelho confirmado

### Prompt para Opus
```
TASK: T-051 TDD-Test processor.ts
ARQUIVO: src/financial/processor.test.ts (criar)

FUNÇÃO A TESTAR: processMessage(message: string, userId: string, llm: LlmClient): Promise<ProcessResult>

ProcessResult:
- type: "created" | "rejected" | "query" | "unknown"
- transaction?: Transaction (Prisma)
- reply: string (mensagem de retorno ao usuário)

FLUXO INTERNO (real processor):
1. classifyIntent(message)
2. Se "transaction": loadPrompt + llm.complete() + parseAiResponse() + salvar no DB
3. Se Transaction tem invoiceId → prisma.$transaction([createTransaction, incrementInvoice]) (ATÔMICO)
4. Se "query": retornar resposta informativa (mock simples por ora)
5. Se "unknown": retornar resposta padrão

CASOS DE TESTE (banco real + FakeLlmClient):
1. Mensagem de despesa simples → Transaction criada, reply com confirmação
2. Mensagem de despesa no cartão (invoiceId) → Transaction criada + Invoice.totalAmount incrementado
3. Mensagem não-transacional ("oi") → type "unknown", sem Transaction
4. LLM retorna JSON inválido → type "rejected", sem Transaction no DB

SEED NECESSÁRIO:
- Um User no DB
- Uma Invoice ativa (para teste 2)

INSTRUÇÕES:
- NÃO criar src/financial/processor.ts
- Usar FakeLlmClient importado de src/ai/fake-llm-client.ts
- Vermelho ao final

ARQUIVOS PERMITIDOS: src/financial/processor.test.ts
ARQUIVOS PROIBIDOS: src/financial/processor.ts e todo o resto

DEFINIÇÃO DE PRONTO:
Reportar casos e vermelho. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] Teste com banco real + FakeLlmClient
- [ ] Caso atômico (invoiceId) testado
- [ ] Vermelho confirmado
- [ ] Commit `T-051: test processor vermelho`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-052: [TDD-Impl] processor.ts — implementação real

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Impl |
| **Depende de** | T-051 |
| **Estimativa** | ~45min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/financial/processor.ts` (criar)

### Arquivos proibidos de tocar
- `src/financial/processor.test.ts`
- `src/processor/stub.ts` (manter intacto — troca acontece em S-3)

### Critérios de aceite
- [ ] `pnpm test processor` verde com banco real
- [ ] `prisma.$transaction([...])` para criação atômica com invoiceId
- [ ] `Invoice.totalAmount` incrementado no mesmo `$transaction`
- [ ] Exporta `ProcessResult` como tipo

### Prompt para Opus
```
TASK: T-052 TDD-Impl processor.ts
ARQUIVO: src/financial/processor.ts (criar)

Implementar processMessage(message: string, userId: string, llm: LlmClient): Promise<ProcessResult>
Fazer passar src/financial/processor.test.ts.

REGRA CRÍTICA (docs/specs/02 §10):
Toda criação de Transaction com invoiceId DEVE usar prisma.$transaction([
  prisma.transaction.create({...}),
  prisma.invoice.update({ where: { id: invoiceId }, data: { totalAmount: { increment: amount } } })
])

Exportar: type ProcessResult = { type: "created"|"rejected"|"query"|"unknown", transaction?: Transaction, reply: string }

ARQUIVOS PERMITIDOS: src/financial/processor.ts
ARQUIVOS PROIBIDOS: tudo que já existe (especialmente src/processor/stub.ts — não mexer)

DEFINIÇÃO DE PRONTO:
Reportar verde. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] `pnpm test processor` verde
- [ ] `prisma.$transaction` usado para casos com invoiceId
- [ ] `pnpm lint` limpo
- [ ] Commit `T-052: impl processor verde`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-053: README Parte B

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | Docs |
| **Depende de** | T-052 |
| **Estimativa** | ~20min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/ai/README.md` (criar)

### Arquivos proibidos de tocar
- Qualquer arquivo de código

### Critérios de aceite
- [ ] Descreve cada módulo da Parte B (extract-json, schemas, sanitize, confidence, dates, categories, service, intent, prompt-loader, llm-client, processor)
- [ ] Explica o fluxo completo: mensagem → processMessage → reply
- [ ] Menciona FakeLlmClient para testes

### Prompt para Opus
```
TASK: T-053 README Parte B
ARQUIVO: src/ai/README.md (criar)

Documentar a Parte B (Pipeline IA) do botfinancas.

ESTRUTURA SUGERIDA:
1. Visão geral do fluxo
2. Módulos (um parágrafo cada)
3. Como rodar os testes da Parte B
4. Como usar FakeLlmClient nos testes

Baseado nos arquivos em src/ai/ e src/financial/processor.ts.

ARQUIVOS PERMITIDOS: src/ai/README.md
ARQUIVOS PROIBIDOS: tudo que já existe

DEFINIÇÃO DE PRONTO:
Mostrar conteúdo do README. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] README criado com todos os módulos documentados
- [ ] Commit `T-053: README parte B`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-054: Review S-2

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | Review |
| **Depende de** | T-053 |
| **Estimativa** | ~30min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- Nenhum (read-only)

### Arquivos proibidos de tocar
- Tudo

### Critérios de aceite
- [ ] Todos os testes de S-2 verdes
- [ ] `pnpm lint` limpo
- [ ] Regra atômica (prisma.$transaction) verificada
- [ ] Nenhum `any` explícito

### Prompt para Opus
```
TASK: T-054 Review S-2
MODO: read-only

Executar:
- pnpm test (reportar por arquivo)
- pnpm lint

Verificar:
- src/ai/{extract-json,schemas,sanitize,confidence,dates,categories,service,intent,prompt-loader,llm-client,fake-llm-client}.ts existem
- src/financial/processor.ts existe
- prisma.$transaction é usado em processor.ts para casos com invoiceId
- Nenhum `any` explícito nos arquivos de S-2

ARQUIVOS PERMITIDOS: nenhum (read-only)
ARQUIVOS PROIBIDOS: tudo

DEFINIÇÃO DE PRONTO:
1. Reportar checklist verde/vermelho
2. Se tudo verde: "S-2 aprovada."
3. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] Todos os critérios verdes
- [ ] Commit `T-054: review S-2 aprovada`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## Sprint S-3 — Integração A↔B

---

## [ ] T-055: Trocar stubProcessor por realProcessor no webhook

| Campo | Valor |
|---|---|
| **Sprint** | S-3 |
| **Camada** | Compartilhado |
| **Tipo** | Refactor |
| **Depende de** | T-029 (S-1 aprovada) + T-054 (S-2 aprovada) |
| **Estimativa** | ~20min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/app/api/webhooks/telegram/route.ts` (editar)

### Arquivos proibidos de tocar
- `src/processor/stub.ts` (manter para referência)
- Qualquer arquivo de teste

### Critérios de aceite
- [ ] `route.ts` importa `processMessage` de `src/financial/processor.ts`
- [ ] `route.ts` NÃO importa mais `src/processor/stub.ts`
- [ ] `pnpm test` ainda verde (testes existentes não quebram)

### Prompt para Opus
```
TASK: T-055 Trocar stub por real processor
ARQUIVO: src/app/api/webhooks/telegram/route.ts (editar)

Substituir a importação do stub pelo processador real.

DE: import { processMessage } from '@/processor/stub'
PARA: import { processMessage } from '@/financial/processor'

Ajustar a chamada se a assinatura mudou (adicionar parâmetro llm se necessário — usar OllamaLlmClient).

INSTRUÇÕES:
- Verificar pnpm test ao final
- NÃO apagar src/processor/stub.ts

ARQUIVOS PERMITIDOS: src/app/api/webhooks/telegram/route.ts
ARQUIVOS PROIBIDOS: tudo que já existe (especialmente testes e stub.ts)

DEFINIÇÃO DE PRONTO:
Reportar alteração feita e resultado de pnpm test. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] Import trocado em route.ts
- [ ] `pnpm test` verde
- [ ] Commit `T-055: webhook usa realProcessor`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-056: Integration tests A↔B

| Campo | Valor |
|---|---|
| **Sprint** | S-3 |
| **Camada** | Compartilhado |
| **Tipo** | TDD-Test |
| **Depende de** | T-055 |
| **Estimativa** | ~40min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `src/app/api/webhooks/telegram/route.integration.test.ts` (criar)

### Arquivos proibidos de tocar
- `src/app/api/webhooks/telegram/route.ts`
- Qualquer outro arquivo

### Critérios de aceite
- [ ] Testa webhook completo end-to-end (banco real + FakeLlmClient)
- [ ] Verifica resposta HTTP 200 com reply correto
- [ ] Verifica Transaction criada no banco
- [ ] Verifica Invoice.totalAmount incrementado para casos com cartão

### Prompt para Opus
```
TASK: T-056 Integration tests A↔B
ARQUIVO: src/app/api/webhooks/telegram/route.integration.test.ts (criar)

Testar o webhook completo com banco real e FakeLlmClient.

SETUP: usar NextRequest simulado (ou fetch para o servidor de teste Next.js)

CASOS:
1. POST com update Telegram válido (despesa) → HTTP 200, Transaction no DB, reply correto
2. POST com update Telegram (despesa no cartão) → HTTP 200, Transaction no DB, Invoice.totalAmount++
3. POST sem token de autenticação → HTTP 401
4. POST com corpo inválido → HTTP 400

INSTRUÇÃO: injetar FakeLlmClient no processador (via DI ou variável de ambiente TEST_MODE)

ARQUIVOS PERMITIDOS: src/app/api/webhooks/telegram/route.integration.test.ts
ARQUIVOS PROIBIDOS: tudo que já existe

DEFINIÇÃO DE PRONTO:
Reportar testes escritos e resultado. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] Testes de integração escritos
- [ ] `pnpm test` verde
- [ ] Commit `T-056: integration tests A-B verde`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-057: Smoke test manual

| Campo | Valor |
|---|---|
| **Sprint** | S-3 |
| **Camada** | Compartilhado |
| **Tipo** | Manual |
| **Depende de** | T-056 |
| **Estimativa** | ~15min |
| **Pode rodar em paralelo com** | nenhuma |

### Critérios de aceite
- [ ] `pnpm dev` sobe sem erros
- [ ] Mensagem real enviada via Telegram → resposta recebida
- [ ] Transaction aparece no banco (verificar via prisma studio ou query)
- [ ] Nenhum erro no console do servidor

### Prompt para Opus
```
TASK: T-057 Smoke test manual
MODO: semi-manual (Opus executa comandos, humano confirma Telegram)

1. Rodar pnpm dev
2. Verificar se ngrok/tunnel está ativo e webhook configurado
3. Reportar URL do webhook e instruções para o humano testar manualmente
4. Após confirmação do humano, verificar banco: SELECT * FROM "Transaction" ORDER BY "createdAt" DESC LIMIT 1;

ARQUIVOS PERMITIDOS: nenhum
ARQUIVOS PROIBIDOS: tudo

DEFINIÇÃO DE PRONTO:
Reportar resultado do smoke test. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] Smoke test passou
- [ ] Commit `T-057: smoke test S-3 ok`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## [ ] T-058: Review S-3 (revisão final MVP)

| Campo | Valor |
|---|---|
| **Sprint** | S-3 |
| **Camada** | Compartilhado |
| **Tipo** | Review |
| **Depende de** | T-057 |
| **Estimativa** | ~30min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- Nenhum (read-only)

### Arquivos proibidos de tocar
- Tudo

### Prompt para Opus
```
TASK: T-058 Review S-3 — revisão final MVP
MODO: read-only

Executar:
- pnpm test (reportar todos os suites)
- pnpm lint
- pnpm build (verificar sem erros de compilação)

Verificar integração:
- route.ts importa financial/processor (não stub)
- Testes de integração A↔B existem e passam
- prisma.$transaction usado para casos com invoiceId

DEFINIÇÃO DE PRONTO:
1. Checklist verde/vermelho
2. Se tudo verde: "MVP S-3 aprovado. Botfinancas pronto para uso."
3. NÃO fazer commit. Pare.
```

### Checklist de fechamento
- [ ] Todos os critérios verdes
- [ ] `pnpm build` sem erros
- [ ] Commit `T-058: review S-3 MVP aprovado`
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)

---

## Sprints S-4 a S-12 — Placeholders

---

## [ ] T-059: Placeholder S-4 — Relatórios e consultas

| Campo | Valor |
|---|---|
| **Sprint** | S-4 |
| **Camada** | Parte B |
| **Tipo** | Placeholder |
| **Depende de** | T-058 |

### Descrição
Sprint S-4 não detalhada ainda. Objetivo: implementar respostas a queries do usuário (saldo, extrato, resumo por categoria). Detalhar quando S-3 estiver aprovado.

### Notas de execução
(detalhar antes de iniciar)

---

## [ ] T-060: Placeholder S-5 — InvoicePayment e paidAmount atômico

| Campo | Valor |
|---|---|
| **Sprint** | S-5 |
| **Camada** | Parte A |
| **Tipo** | Placeholder |
| **Depende de** | T-058 |

### Descrição
Implementar criação de InvoicePayment com incremento atômico de `Invoice.paidAmount` via `prisma.$transaction`. Mesma regra de atomicidade aplicada em T-052 para totalAmount. Detalhar quando S-4 estiver aprovado.

### Notas de execução
(detalhar antes de iniciar)

---

## [ ] T-061: Placeholder S-6 — Múltiplos usuários e isolamento

| Campo | Valor |
|---|---|
| **Sprint** | S-6 |
| **Camada** | Compartilhado |
| **Tipo** | Placeholder |
| **Depende de** | T-060 |

### Descrição
Garantir isolamento de dados por userId em todas as queries. Testes com dois usuários distintos. Detalhar quando S-5 estiver aprovado.

### Notas de execução
(detalhar antes de iniciar)

---

## [ ] T-062: Placeholder S-7 — Recurring transactions

| Campo | Valor |
|---|---|
| **Sprint** | S-7 |
| **Camada** | Parte A |
| **Tipo** | Placeholder |
| **Depende de** | T-061 |

### Descrição
Suporte a transações recorrentes (campo `isRecurring`, `recurrenceRule`). Detalhar quando S-6 estiver aprovado.

### Notas de execução
(detalhar antes de iniciar)

---

## [ ] T-063: Placeholder S-8 — Dashboard web

| Campo | Valor |
|---|---|
| **Sprint** | S-8 |
| **Camada** | Frontend |
| **Tipo** | Placeholder |
| **Depende de** | T-062 |

### Descrição
Interface web para visualização de transações, saldo e faturas. Next.js 14 App Router + Tailwind. Detalhar quando S-7 estiver aprovado.

### Notas de execução
(detalhar antes de iniciar)

---

## [ ] T-064: Placeholder S-9 — Autenticação web

| Campo | Valor |
|---|---|
| **Sprint** | S-9 |
| **Camada** | Frontend |
| **Tipo** | Placeholder |
| **Depende de** | T-063 |

### Descrição
Auth para o dashboard web (NextAuth ou Clerk). Vincular conta Telegram ao login web. Detalhar quando S-8 estiver aprovado.

### Notas de execução
(detalhar antes de iniciar)

---

## [ ] T-065: Placeholder S-10 — Exportação de dados

| Campo | Valor |
|---|---|
| **Sprint** | S-10 |
| **Camada** | Parte A |
| **Tipo** | Placeholder |
| **Depende de** | T-064 |

### Descrição
Exportar transações em CSV/PDF. Detalhar quando S-9 estiver aprovado.

### Notas de execução
(detalhar antes de iniciar)

---

## [ ] T-066: Placeholder S-11 — Notificações e lembretes

| Campo | Valor |
|---|---|
| **Sprint** | S-11 |
| **Camada** | Parte B |
| **Tipo** | Placeholder |
| **Depende de** | T-065 |

### Descrição
Enviar notificações proativas via Telegram (vencimento de fatura, resumo semanal). Detalhar quando S-10 estiver aprovado.

### Notas de execução
(detalhar antes de iniciar)

---

## [ ] T-067: Placeholder S-12 — Deploy e observabilidade

| Campo | Valor |
|---|---|
| **Sprint** | S-12 |
| **Camada** | Infra |
| **Tipo** | Placeholder |
| **Depende de** | T-066 |

### Descrição
Deploy em produção (Vercel ou VPS), configuração de variáveis de ambiente, logging estruturado, alertas de erro. Detalhar quando S-11 estiver aprovado.

### Notas de execução
(detalhar antes de iniciar)

---

## Conflitos detectados

| ID | Descrição | Specs envolvidas | Status |
|---|---|---|---|
| C-1 | **Resolvido:** `Invoice.totalAmount` não tinha regra de atualização atômica | docs/specs/00 §2, docs/specs/02 §10 | Corrigido nas duas specs |

---

## Tasks futuras (fora do MVP)

- **Multi-idioma:** suporte a mensagens em inglês e espanhol no pipeline IA
- **LLM alternativo:** abstrair OllamaLlmClient para suportar OpenAI/Anthropic via mesma interface `LlmClient`
- **Budget alerts:** alertar quando gasto em categoria supera limite definido pelo usuário
- **Importação OFX/CSV:** ingestão de extratos bancários via arquivo
- **Testes de carga:** verificar performance do webhook sob múltiplas mensagens simultâneas
