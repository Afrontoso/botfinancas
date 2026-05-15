# Contratos Compartilhados — Botfinancas

Este documento define **as fronteiras** entre Parte A e Parte B. Ambas as implementações devem respeitar exatamente os artefatos aqui definidos. Estes arquivos devem ser criados **antes** de qualquer trabalho nas duas partes e **não devem ser alterados unilateralmente** por nenhuma das duas implementações.

> **Versão:** 2026-05-13. Schema expandido após fechamento da Sprint 0.5: cofres como sub-contas, faturas de cartão com pré-pagamento parcial, splits com contatos e pagamentos parciais, gastos fixos recorrentes, orçamentos por categoria, lembretes.

---

## 1. Stack base (idêntica para ambas as partes)

- Node.js 20+
- TypeScript em modo `strict`
- pnpm como gerenciador de pacotes
- Vitest para testes unitários e de integração
- Prisma 5+ como ORM
- PostgreSQL 16 local
- Zod para validação

`tsconfig.json` deve ter `"strict": true`, `"noUncheckedIndexedAccess": true`, `"target": "ES2022"`, `"module": "ESNext"`, `"moduleResolution": "bundler"`.

---

## 2. Schema do banco — `prisma/schema.prisma`

A Parte A é **dona** do schema e das migrations. A Parte B **consome** via `@prisma/client` gerado, mas **não modifica** o schema sem alinhamento.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── USUÁRIOS E CONTATOS ──────────────────────────────────────────────────────

model User {
  id              String   @id @default(cuid())
  telegramUserId  String   @unique
  name            String
  timezone        String   @default("America/Sao_Paulo")
  defaultCurrency String   @default("BRL")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  accounts          Account[]
  categories        Category[]
  transactions      Transaction[]
  messages          MessageLog[]
  inferences        AiInference[]
  memory            MemoryEntry[]
  contacts          Contact[]
  recurringExpenses RecurringExpense[]
  budgets           Budget[]
  reminders         Reminder[]
}

/// Pessoas externas com quem o usuário divide despesas (ex: esposa, amigo).
/// NÃO é um User — não tem login, não tem Telegram, não tem contas próprias no sistema.
model Contact {
  id        String   @id @default(cuid())
  userId    String
  name      String
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user   User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  splits SharedSplit[]

  @@unique([userId, name])
  @@index([userId])
}

// ─── CONTAS E COFRES ──────────────────────────────────────────────────────────

/// Representa qualquer conta financeira do usuário.
/// Cofres (vaults) são modelados como Account com type=vault e parentAccountId apontando
/// para a conta-mãe. Cofres podem ser efêmeros ("cofre da farmácia", "cofre do cartão deste mês").
/// Cartões de crédito usam closingDay e dueDay para cálculo de fatura.
model Account {
  id              String      @id @default(cuid())
  userId          String
  parentAccountId String?     // null para conta raiz; preenchido para cofres
  name            String
  type            AccountType
  currency        String      @default("BRL")
  initialBalance  Decimal     @default(0) @db.Decimal(14, 2)
  closingDay      Int?        // 1-31, obrigatório se type=credit_card
  dueDay          Int?        // 1-31, obrigatório se type=credit_card
  archived        Boolean     @default(false)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user             User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  parentAccount    Account?          @relation("AccountHierarchy", fields: [parentAccountId], references: [id])
  childAccounts    Account[]         @relation("AccountHierarchy")
  transactions     Transaction[]
  invoices         Invoice[]
  recurringExpenses RecurringExpense[]

  @@index([userId, type])
  @@index([parentAccountId])
}

enum AccountType {
  checking
  cash
  credit_card
  savings
  investment
  wallet
  vault         // sub-conta de poupança/separação dentro de outra conta
}

// ─── FATURAS DE CARTÃO ────────────────────────────────────────────────────────

/// Uma fatura por mês de competência por cartão. Compras feitas no cartão entre
/// `periodStart` e `periodEnd` pertencem a esta fatura. Pagamento pode ser feito
/// em vários pedaços ao longo do mês (pré-pagamento) — cada pagamento abate
/// `paidAmount`. Status muda automaticamente conforme paidAmount evolui.
model Invoice {
  id          String        @id @default(cuid())
  accountId   String        // Account com type=credit_card
  periodStart DateTime      // dia seguinte ao closingDay anterior
  periodEnd   DateTime      // closingDay deste período
  dueDate     DateTime      // dueDay correspondente
  totalAmount Decimal       @default(0) @db.Decimal(14, 2)
  paidAmount  Decimal       @default(0) @db.Decimal(14, 2)
  status      InvoiceStatus @default(open)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  account      Account          @relation(fields: [accountId], references: [id], onDelete: Cascade)
  transactions Transaction[]    @relation("InvoiceCharges")
  payments     InvoicePayment[]

  @@unique([accountId, periodStart])
  @@index([accountId, status])
  @@index([dueDate])
}

enum InvoiceStatus {
  open       // ainda recebendo lançamentos (antes do closingDay)
  closed     // fechada, aguardando pagamento, paidAmount = 0
  partial    // parcialmente paga, 0 < paidAmount < totalAmount
  paid       // totalmente paga, paidAmount >= totalAmount
}

/// Liga um pagamento (Transaction de transferência) a uma Invoice.
/// A data de pagamento é a `transactionDate` da Transaction vinculada — não duplicar aqui.
model InvoicePayment {
  id            String   @id @default(cuid())
  invoiceId     String
  transactionId String   @unique  // a Transaction de transferência que pagou
  amount        Decimal  @db.Decimal(14, 2)
  createdAt     DateTime @default(now())

  invoice     Invoice     @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  transaction Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)

  @@index([invoiceId])
}

// ─── CATEGORIAS ───────────────────────────────────────────────────────────────

model Category {
  id        String       @id @default(cuid())
  userId    String
  name      String
  type      CategoryType
  parentId  String?
  createdAt DateTime     @default(now())

  user              User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent            Category?          @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children          Category[]         @relation("CategoryHierarchy")
  transactions      Transaction[]
  budgets           Budget[]
  recurringExpenses RecurringExpense[]

  @@unique([userId, name])
  @@index([userId])
}

enum CategoryType {
  expense
  income
  transfer
}

// ─── TRANSAÇÕES ───────────────────────────────────────────────────────────────

/// Transação financeira atômica. Convenção:
///  - `expense` e `income`: 1 Transaction, `direction` deve ser null.
///  - `transfer`: 2 Transactions com o mesmo `transferGroupId`, ambas amount positivo,
///    uma com `direction=out` (conta origem) e outra com `direction=in` (conta destino).
///  - `adjustment`: 1 Transaction, `direction` deve ser null.
/// O campo `direction` SÓ deve ser preenchido para `type=transfer`. Para outros tipos,
/// o sentido de saída/entrada é inferido pelo `type`.
model Transaction {
  id                String                @id @default(cuid())
  userId            String
  accountId         String?
  categoryId        String?
  invoiceId         String?               // preenchido quando é compra em cartão
  type              TransactionType
  direction         TransactionDirection? // SÓ para type=transfer; null para os demais
  amount            Decimal               @db.Decimal(14, 2)
  currency          String              @default("BRL")
  description       String
  transactionDate   DateTime
  paymentMethod     String?
  installmentNumber Int?
  installmentTotal  Int?
  source            TransactionSource   @default(telegram_text)
  confidence        Float?
  status            TransactionStatus   @default(confirmed)
  transferGroupId   String?             // liga as duas pernas de uma transferência
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  user                  User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  account               Account?            @relation(fields: [accountId], references: [id])
  category              Category?           @relation(fields: [categoryId], references: [id])
  invoice               Invoice?            @relation("InvoiceCharges", fields: [invoiceId], references: [id])
  splits                SharedSplit[]       @relation("ExpenseSplits")
  splitSettlement       SplitSettlement?    @relation("SettlementTransaction")
  invoicePayment        InvoicePayment?

  @@index([userId, transactionDate])
  @@index([userId, type])
  @@index([transferGroupId])
  @@index([invoiceId])
}

enum TransactionType {
  expense       // saída de dinheiro
  income        // entrada de dinheiro (salário, rendimento, settlement)
  transfer      // movimentação entre contas do próprio usuário
  adjustment    // ajuste manual de saldo
}

enum TransactionDirection {
  out   // dinheiro saindo da conta referenciada
  in    // dinheiro entrando na conta referenciada
}

enum TransactionSource {
  telegram_text
  telegram_audio
  telegram_image
  manual         // entrada manual (futuro: dashboard)
}

enum TransactionStatus {
  confirmed
  pending_confirmation
  rejected
}

// ─── SPLITS COM CONTATOS ──────────────────────────────────────────────────────

/// Marca uma despesa como compartilhada com um Contact. Ex: "comprei R$200 de
/// mercado, metade é da esposa" → SharedSplit com expectedAmount=100.
/// Pagamentos parciais ficam em SplitSettlement. Quando soma dos settlements
/// atinge expectedAmount, status vira `settled`. Se usuário decide não cobrar
/// o restante, marca como `absorbed`.
model SharedSplit {
  id             String      @id @default(cuid())
  transactionId  String      // a despesa original
  contactId      String
  expectedAmount Decimal     @db.Decimal(14, 2)
  status         SplitStatus @default(open)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  transaction Transaction       @relation("ExpenseSplits", fields: [transactionId], references: [id], onDelete: Cascade)
  contact     Contact           @relation(fields: [contactId], references: [id])
  settlements SplitSettlement[]

  @@index([transactionId])
  @@index([contactId, status])
}

enum SplitStatus {
  open       // pagamento esperado ainda não totalmente recebido
  settled    // expectedAmount totalmente pago
  absorbed   // usuário marcou como "eu cubro o que falta"
}

/// Cada pagamento parcial recebido referente a um SharedSplit. A própria entrada
/// de dinheiro é uma Transaction (type=income, vinda do Contact); este registro
/// liga essa transação ao split correspondente.
/// A data de pagamento é a `transactionDate` da settlementTransaction — não duplicar aqui.
model SplitSettlement {
  id                      String   @id @default(cuid())
  splitId                 String
  settlementTransactionId String   @unique
  amount                  Decimal  @db.Decimal(14, 2)
  createdAt               DateTime @default(now())

  split                 SharedSplit @relation(fields: [splitId], references: [id], onDelete: Cascade)
  settlementTransaction Transaction @relation("SettlementTransaction", fields: [settlementTransactionId], references: [id], onDelete: Cascade)

  @@index([splitId])
}

// ─── GASTOS FIXOS RECORRENTES ─────────────────────────────────────────────────

/// Despesas/receitas que se repetem periodicamente (aluguel, internet,
/// assinaturas, salário). Usado para: (a) auto-preencher quando usuário
/// menciona ("paguei aluguel" → bot já sabe valor e categoria); (b) gerar
/// lembretes quando dia esperado passar sem registro (ver Reminder, S-7).
model RecurringExpense {
  id             String          @id @default(cuid())
  userId         String
  name           String          // "Aluguel", "Internet Vivo"
  expectedAmount Decimal         @db.Decimal(14, 2)
  currency       String          @default("BRL")
  type           TransactionType @default(expense)
  categoryId     String?
  accountId      String?
  periodicity    RecurringPeriod
  expectedDay    Int             // dia do mês (1-31), dia da semana (1-7) ou dia do ano (1-366)
  active         Boolean         @default(true)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  category  Category?  @relation(fields: [categoryId], references: [id])
  account   Account?   @relation(fields: [accountId], references: [id])
  reminders Reminder[]

  @@unique([userId, name])
  @@index([userId, active])
}

enum RecurringPeriod {
  monthly
  weekly
  yearly
}

// ─── ORÇAMENTOS ───────────────────────────────────────────────────────────────

/// Limite de gastos por categoria por período. Progresso é calculado por query
/// (sum de Transaction expense por categoria no período), não armazenado.
model Budget {
  id         String       @id @default(cuid())
  userId     String
  categoryId String
  amount     Decimal      @db.Decimal(14, 2)
  period     BudgetPeriod @default(monthly)
  startDate  DateTime
  active     Boolean      @default(true)
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id])

  @@index([userId, active])
  @@index([categoryId, active])
}

enum BudgetPeriod {
  monthly
  weekly
}

// ─── LEMBRETES ────────────────────────────────────────────────────────────────

/// Notificações agendadas que o bot envia ao usuário. Execução real (cron + envio
/// pelo Telegram) entra em S-7. No MVP só existe a estrutura de dados.
model Reminder {
  id                 String         @id @default(cuid())
  userId             String
  type               ReminderType
  scheduledFor       DateTime
  status             ReminderStatus @default(pending)
  payload            Json           // dados específicos do tipo
  recurringExpenseId String?
  sentAt             DateTime?
  createdAt          DateTime       @default(now())

  user             User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  recurringExpense RecurringExpense? @relation(fields: [recurringExpenseId], references: [id], onDelete: Cascade)

  @@index([userId, status, scheduledFor])
}

enum ReminderType {
  recurring_missing   // dia esperado de gasto fixo passou sem registro
  budget_alert        // orçamento de uma categoria perto do limite
  invoice_due         // fatura vence em N dias
  custom
}

enum ReminderStatus {
  pending
  sent
  dismissed
  cancelled
}

// ─── LOGS DE MENSAGENS E INFERÊNCIAS ──────────────────────────────────────────

model MessageLog {
  id                String      @id @default(cuid())
  userId            String
  telegramMessageId String
  chatId            String
  messageType       MessageType
  rawPayload        Json
  normalizedText    String?
  createdAt         DateTime    @default(now())

  user       User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  inferences AiInference[]

  @@unique([chatId, telegramMessageId])
  @@index([userId, createdAt])
}

enum MessageType {
  text
  audio
  image
  document
  unknown
}

model AiInference {
  id            String          @id @default(cuid())
  userId        String
  messageLogId  String
  model         String
  promptVersion String
  input         String
  rawOutput     String
  parsedOutput  Json?
  status        InferenceStatus
  error         String?
  latencyMs     Int
  createdAt     DateTime        @default(now())

  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  messageLog MessageLog @relation(fields: [messageLogId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
}

enum InferenceStatus {
  success
  parse_error
  validation_error
  llm_error
  low_confidence
}

model MemoryEntry {
  id        String    @id @default(cuid())
  userId    String
  scope     String
  content   Json
  metadata  Json?
  expiresAt DateTime?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, scope])
  @@index([expiresAt])
}
```

> Observações de modelagem:
>
> - **Cofres (vaults)** = `Account` com `type=vault` e `parentAccountId` preenchido. Saldo é calculado por queries (sum de Transaction com `accountId` igual ao do cofre). Rendimento manual = `Transaction` tipo `income` no cofre, com categoria "Rendimento".
> - **Transferências** = duas Transactions com mesmo `transferGroupId`, ambas `type=transfer`, uma com `direction=out` na conta origem, outra com `direction=in` na conta destino. Soma de saldos do par é zero por construção.
> - **Pagamento de fatura** = transferência da conta corrente para "saldo do cartão". Cria duas Transactions com transferGroupId; a Transaction de entrada (no cartão) também aparece em `InvoicePayment`, abatendo o `paidAmount` da `Invoice` correspondente.
> - **Compras no cartão** = `Transaction` tipo `expense`, `accountId` apontando para o cartão, `invoiceId` para a fatura aberta no momento (calculada pelo serviço com base em `transactionDate` + `closingDay`). A criação da `Transaction` e o incremento de `Invoice.totalAmount` devem ocorrer na mesma `prisma.$transaction([...])` — `totalAmount` é mantido denormalizado pelo serviço (não calculado on-the-fly) para evitar aggregation query a cada leitura.
> - **`Attachment`** mencionado no roadmap §3.3 fica fora do MVP. Será adicionado em S-9/S-10 (mídia).

---

## 3. Contrato `processMessage` — `shared/contract.ts`

Único ponto de costura entre Parte A e Parte B. A Parte A chama; a Parte B implementa.

```ts
// shared/contract.ts

export interface ProcessInput {
  userId: string;            // ID interno do User (não o telegramUserId)
  text: string;              // Texto já normalizado (trim, etc.)
  receivedAt: Date;          // Timestamp da chegada do webhook
  messageLogId: string;      // ID do MessageLog já persistido pela Parte A
}

export type ProcessResult =
  | {
      kind: 'transaction_created';
      transactionIds: string[];   // 1 para despesa/receita; 2+ para transferência ou expense+split
      transferGroupId?: string;   // preenchido quando houver transferência
      reply: string;              // texto pronto para enviar ao Telegram
    }
  | {
      kind: 'needs_confirmation';
      draftIds: string[];         // Transactions com status=pending_confirmation
      reply: string;
    }
  | {
      kind: 'query_answered';
      reply: string;
    }
  | {
      kind: 'error';
      reply: string;              // mensagem amigável para o usuário
      reason: string;             // detalhe técnico (vai pra log, não pro Telegram)
    };

export interface MessageProcessor {
  processMessage(input: ProcessInput): Promise<ProcessResult>;
}
```

**Garantias do contrato:**

- A Parte B **nunca lança exceção** desta função. Erros internos viram `{ kind: 'error' }`.
- A Parte B é responsável por persistir `Transaction`, `AiInference`, `Invoice`, `InvoicePayment`, `SharedSplit`, `SplitSettlement`, `MemoryEntry` quando aplicável.
- A Parte A é responsável por persistir `MessageLog` **antes** de chamar `processMessage`.
- O `reply` retornado é texto puro (sem Markdown), pronto para `sendMessage` do Telegram.
- `transactionIds` sempre tem ao menos 1 elemento quando `kind=transaction_created`. Para transferências, são 2 (saída + entrada). Para despesa com split, são 1 (a despesa) — o split é uma entidade separada, não Transaction.

**Intenções que a Parte B precisa reconhecer e mapear para `ProcessResult`:**

| Intenção do usuário | Exemplo | Resultado esperado |
|---|---|---|
| Registrar despesa | "Gastei 50 no mercado" | `transaction_created`, 1 tx |
| Registrar receita | "Recebi 3000 de salário" | `transaction_created`, 1 tx |
| Registrar transferência | "Passei 500 da Nubank pro Itaú" | `transaction_created`, 2 tx + transferGroupId |
| Compra no cartão | "Comprei 120 no cartão Inter" | `transaction_created`, 1 tx, vinculada à Invoice aberta |
| Pagamento parcial de fatura | "Paguei 200 da fatura da Nubank" | `transaction_created`, 2 tx + transferGroupId, registra InvoicePayment |
| Despesa com split | "Comprei 200 de mercado, metade da Ana" | `transaction_created`, 1 tx + cria SharedSplit |
| Settlement de split | "Ana me transferiu 100" | `transaction_created`, 1 tx (income) + cria SplitSettlement |
| Rendimento de cofre | "Rendeu 12 reais no cofre da viagem" | `transaction_created`, 1 tx (income, categoria Rendimento) |
| Confirmar gasto fixo | "Paguei o aluguel" | `transaction_created`, 1 tx auto-preenchida pelo RecurringExpense |
| Consulta de saldo/categoria | "Quanto gastei esse mês?" | `query_answered` |
| Consulta de fatura | "Quanto tá a fatura da Nubank?" | `query_answered` |
| Consulta de orçamento | "Quanto sobrou do orçamento de comida?" | `query_answered` |
| Confirmar lançamento ambíguo | "sim" / "não" | depende do contexto em `MemoryEntry` |
| Texto incompreensível | "asdfgh" | `error` com reply pedindo reformulação |

---

## 4. Fixtures compartilhadas — `shared/fixtures/`

Cada fixture é um arquivo JSON em `shared/fixtures/<nome>.json`. A Parte A as usa em testes de integração; a Parte B as usa em testes unitários do parser.

Estrutura mínima:

```json
{
  "name": "expense_simple",
  "input": {
    "text": "Gastei 50 no mercado ontem",
    "currentDate": "2026-05-13"
  },
  "llmRawResponse": "{\"intent\":\"create_transaction\",\"type\":\"expense\",\"amount\":50,\"currency\":\"BRL\",\"description\":\"Mercado\",\"category\":\"Mercado\",\"transactionDate\":\"2026-05-12\",\"paymentMethod\":null,\"confidence\":0.92}",
  "expected": {
    "kind": "transaction_created",
    "tx": {
      "type": "expense",
      "amount": 50,
      "category": "Mercado",
      "transactionDate": "2026-05-12",
      "status": "confirmed"
    }
  }
}
```

### Fixtures obrigatórias para o MVP (S-1, S-2, S-3)

| nome | input | comportamento esperado |
|---|---|---|
| `expense_simple` | "Gastei 50 no mercado ontem" | transação confirmada |
| `income_salary` | "Recebi 3000 de salario" | transação tipo income |
| `expense_with_card` | "Paguei 120 no cartão Nubank" | transação com paymentMethod, vinculada ao cartão |
| `llm_with_markdown` | qualquer | LLM responde com ```json...``` — parser extrai mesmo assim |
| `llm_with_prefix` | qualquer | LLM responde "Claro! Aqui está: {...}" — parser extrai |
| `llm_low_confidence` | "comprei algo" | needs_confirmation |
| `llm_invalid_json` | qualquer | error com reason "parse_error" |
| `llm_negative_amount` | qualquer | error com reason "validation_error" |
| `query_balance` | "quanto gastei hoje?" | query_answered |

### Fixtures expandidas (S-4 a S-8)

| nome | input | comportamento esperado |
|---|---|---|
| `transfer_between_accounts` | "Passei 500 da Nubank pro Itaú" | `transaction_created` com 2 tx (out+in), `transferGroupId` |
| `invoice_payment_partial` | "Paguei 200 da fatura da Nubank hoje" | 2 tx + transferGroupId; cria `InvoicePayment` com amount=200 abatendo `paidAmount` da Invoice aberta |
| `expense_card_with_split` | "Comprei 100 no cartão pra Ana, ela me paga" | 1 tx expense vinculada à Invoice + 1 SharedSplit com expectedAmount=100 |
| `split_creation_50_50` | "Comprei 200 de mercado, metade é da Ana" | 1 tx expense + 1 SharedSplit com expectedAmount=100, contact=Ana |
| `split_creation_partial_share` | "Comprei 300 de mercado, 90 é da Ana" | 1 tx expense + 1 SharedSplit com expectedAmount=90 |
| `split_settlement_full` | "Ana me transferiu 100 do mercado" | 1 tx income + 1 SplitSettlement; split vira `settled` |
| `split_settlement_partial` | "Ana me pagou 60 daqueles 100" | 1 tx income + 1 SplitSettlement; split continua `open` |
| `split_absorb` | "esquece o que a Ana me deve do mercado, eu cubro" | split vira `absorbed`, sem nova transação |
| `vault_yield` | "Rendeu 12,50 no cofre da viagem" | 1 tx income, accountId=cofre, categoria "Rendimento" |
| `vault_create` | "Cria um cofre da farmácia dentro da Nubank" | cria Account type=vault, parentAccountId=Nubank |
| `recurring_confirm` | "Paguei o aluguel" (com RecurringExpense "Aluguel" cadastrado) | tx auto-preenchida com valor e categoria do RecurringExpense |
| `query_invoice` | "Quanto tá a fatura da Nubank?" | query_answered, calcula totalAmount - paidAmount da Invoice aberta |
| `query_budget` | "Quanto sobrou do orçamento de comida?" | query_answered, compara sum(expense em comida no período) vs Budget.amount |
| `query_balance_with_vault` | "Quanto tenho na Nubank no total?" | query_answered, soma conta principal + cofres filhos |

### Convenção de naming

- Arquivos: `snake_case.json`
- Campo `name` igual ao nome do arquivo (sem extensão)
- `currentDate` em todas as fixtures = `2026-05-13` (data de referência do MVP)
- IDs em `expected` são opcionais (testes verificam por shape, não por valor exato)

### Cenários compostos (multi-step)

Cada fixture acima corresponde a **uma única chamada** de `processMessage`. Cenários do mundo real que envolvem várias mensagens (ex: "comprei pra esposa, ela me pagou, adiantei a fatura") são **composições** de fixtures unitárias, testadas separadamente em testes de integração:

- **Pré-pagamento de fatura via reembolso de split:** sequência de 3 chamadas — `expense_card_with_split` → `split_settlement_full` → `invoice_payment_partial`. Cada uma é testada com sua própria fixture; o teste de integração roda as três em sequência e verifica o estado final.

Não criar fixture composta — a interface de fixture é deliberadamente unitária para manter o `FakeLlmClient` simples.

---

## 5. Variáveis de ambiente — `.env.example`

```bash
# Banco
DATABASE_URL="postgresql://botfinancas:botfinancas@localhost:5432/botfinancas?schema=public"
TEST_DATABASE_URL="postgresql://botfinancas:botfinancas@localhost:5432/botfinancas_test?schema=public"

# Telegram (Parte A)
TELEGRAM_BOT_TOKEN=""
TELEGRAM_WEBHOOK_SECRET=""
TELEGRAM_ALLOWED_USER_IDS=""  # CSV de telegramUserIds permitidos

# Ollama (Parte B)
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_TEXT_MODEL="llama3.1"

# Logs
LOG_LEVEL="info"
NODE_ENV="development"
```

---

## 6. Estrutura de diretórios alvo

```
botfinancas/
├── prisma/
│   ├── schema.prisma          ← dono: Parte A
│   └── migrations/
├── shared/
│   ├── contract.ts            ← este doc, criado antes das duas partes
│   └── fixtures/
│       └── *.json
├── src/
│   ├── webhook/               ← Parte A
│   ├── ai/                    ← Parte B
│   ├── financial/             ← Parte B (inclui invoices, splits, vaults, budgets)
│   └── lib/                   ← código comum (logger, prisma client, etc.)
├── tests/
│   ├── webhook/               ← Parte A
│   ├── ai/                    ← Parte B
│   └── integration/           ← Parte A (exercita processMessage real)
├── .env.example
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## 7. Setup de testes

### Configuração do Vitest

`vitest.config.ts` na raiz é **obrigatório** — sem ele o `tests/setup.ts` nunca executa e os testes de banco rodam sem truncar tabelas entre suites.

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,                    // libera describe/it/expect sem import
    setupFiles: ['./tests/setup.ts'], // executa hooks before/after de cada suite
    environment: 'node',
    pool: 'forks',                    // isolar processos para evitar conflito no DB
    poolOptions: { forks: { singleFork: true } }, // 1 processo por vez nos testes de DB
    testTimeout: 15_000,
  },
});
```

> **Por que `singleFork`:** múltiplos workers paralelos contra o mesmo `botfinancas_test` corrompem o estado entre suites. Para projeto solo, serializar é mais simples e suficiente. Se algum dia for problema de tempo, adotar testcontainers com banco por worker.

### Banco de teste

Banco dedicado `botfinancas_test` com `TEST_DATABASE_URL` separada. **Não** mockar Prisma.

`tests/setup.ts`:

```ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'node:child_process';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

beforeAll(() => {
  execSync('pnpm prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
  });
});

beforeEach(async () => {
  // Truncar todas as tabelas em ordem inversa de dependência
  await prisma.$executeRawUnsafe(`
    TRUNCATE
      "Reminder",
      "Budget",
      "RecurringExpense",
      "SplitSettlement",
      "SharedSplit",
      "InvoicePayment",
      "Invoice",
      "AiInference",
      "MessageLog",
      "Transaction",
      "MemoryEntry",
      "Category",
      "Account",
      "Contact",
      "User"
    RESTART IDENTITY CASCADE
  `);
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
```

### LLM em testes

Testes da Parte B **nunca** chamam Ollama de verdade. Definir interface `LlmClient` (ver Parte B) e injetar `FakeLlmClient` que retorna o conteúdo da fixture.

---

## 8. Ordem de execução

1. **Sprint 0 (alinhamento técnico):** alguém — humano ou IA — cria o repo, instala deps, escreve `prisma/schema.prisma` (deste doc), `shared/contract.ts`, `shared/fixtures/*.json`, `.env.example`. Roda `pnpm prisma migrate dev --name init`. Commit. **Este passo destrava as duas partes.**
2. **Sprint 1 (Parte A) e Sprint 2 (Parte B) em paralelo:** Parte A e Parte B trabalham contra os contratos acima.
3. **Sprint 3 (integração):** Parte A troca o stub `processMessage` pela implementação real da Parte B. Roda testes de integração.
4. **Sprints S-4 a S-8** adicionam as features expandidas (faturas, cofres, splits, recorrentes, orçamentos) usando o schema já em vigor — cada uma é incremento de comportamento, sem migration estrutural.
