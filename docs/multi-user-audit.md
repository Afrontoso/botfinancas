# Multi-user Isolation Audit (S-6 / T-084)

Toda query Prisma em `src/` foi auditada para garantir que dados de um usuário NUNCA vazem para outro. Convenção: queries que mutam ou listam dados de domínio (Transactions, Categories, Invoices, etc.) DEVEM filtrar por `userId`. Exceções estão justificadas abaixo.

---

## Resultado

✅ **Aprovado.** Nenhuma query lê/escreve dados de outro usuário sem filtro explícito.

---

## Tabela de auditoria

| Arquivo:linha | Operação | Filtro userId? | Justificativa |
|---|---|---|---|
| `src/app/api/webhooks/telegram/route.ts:44` | `prisma.user.upsert({where:{telegramUserId}})` | N/A | Identifica o User pela chave única `telegramUserId` — é justamente quem chamou |
| `src/app/api/webhooks/telegram/route.ts:54` | `prisma.messageLog.create({data:{userId, …}})` | ✅ sim (no `data`) | Cria log SEMPRE associado ao user já resolvido |
| `src/financial/query-handler.ts:17` | `prisma.user.findUnique({where:{id:userId}})` | ✅ sim | Busca o próprio user (timezone) |
| `src/financial/queries.ts:17` | `prisma.transaction.aggregate({where:{userId, …}})` | ✅ sim | sumByPeriod |
| `src/financial/queries.ts:37` | `prisma.transaction.groupBy({where:{userId, …}})` | ✅ sim | listByCategory |
| `src/financial/queries.ts:49` | `prisma.category.findMany({where:{id:{in:[…]}}})` | ⚠️ indireto | Ids vêm de `groupBy` que já filtrou por userId → seguro por transitividade |
| `src/financial/queries.ts:68` | `prisma.transaction.findMany({where:{userId}})` | ✅ sim | listRecent |
| `src/financial/invoice-payment.ts:23` | `prisma.invoice.findUnique({where:{id:invoiceId}})` | ✅ sim (verificação posterior) | Verificamos `invoice.account.userId === userId` e lançamos erro se não bater |
| `src/financial/processor.ts:49` | `prisma.account.findFirst({where:{userId, type, name}})` | ✅ sim | Procura account de cartão do user para invoice payment |
| `src/financial/processor.ts:57` | `prisma.invoice.findFirst({where:{accountId, status}})` | ⚠️ indireto | `accountId` veio de query acima filtrada por userId → seguro |
| `src/financial/processor.ts:87` | `prisma.account.findFirst({where:{userId, type, name}})` | ✅ sim | Procura account de cartão (flow normal de purchase) |
| `src/financial/processor.ts:95` | `prisma.invoice.findFirst({where:{accountId, status}})` | ⚠️ indireto | Mesma justificativa de :57 |
| `src/financial/processor.ts:121` | `prisma.transaction.create({data:{userId, …}})` | ✅ sim | Cria sempre com userId no data |
| `src/financial/processor.ts:122` | `prisma.invoice.update({where:{id:invoiceId}})` | ⚠️ indireto | invoiceId vem de query filtrada por accountId que pertence ao user |
| `src/financial/processor.ts:129` | `prisma.transaction.create({data:{userId, …}})` | ✅ sim | Cria sempre com userId no data |
| `src/financial/categories.ts:25` | `prisma.category.findFirst({where:{userId, name}})` | ✅ sim | findOrCreateCategory |
| `src/financial/categories.ts:36` | `prisma.category.create({data:{userId, …}})` | ✅ sim | findOrCreateCategory |

---

## Cobertura de testes

- `tests/financial/isolation-queries.test.ts` — verifica que TODAS as funções em `queries.ts` retornam apenas dados do `userId` passado.
- `tests/integration/isolation-webhook.integration.test.ts` — verifica E2E que dois `telegramUserId`s distintos geram Users separados e dados não se misturam.
- `tests/financial/categories.test.ts` — já tinha caso "does not return categories from other users (scoped by userId)".
- `tests/financial/invoice-payment.test.ts` — já tinha caso "throws when invoice belongs to another user".

---

## Notas para tasks futuras

- Quando adicionar novas queries (S-7+, S-8+ dashboard, S-10 export), seguir a mesma regra: **toda query de domínio filtra por userId**.
- Endpoints de dashboard (`/dashboard/*`) precisam pegar `userId` da sessão autenticada (S-9), NUNCA aceitar como query param do usuário.
- Endpoints de export (S-10) idem.
- Logs (`MessageLog`, `AiInference`) já têm userId obrigatório no schema.
