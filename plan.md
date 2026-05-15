# Plan: Geração e Execução do Backlog do Botfinancas

## TL;DR

Este documento define **três coisas**:

1. Como transformar o `ROADMAP_AGENTES_IA_FINANCEIRO.md` + `specs/` em um `todo.md` executável.
2. Quais regras a IA executora deve seguir ao trabalhar esse `todo.md` para **não derivar nem alucinar**.
3. O **template de prompt** que cada task do `todo.md` deve embutir, pronto para ser copiado e colado em uma nova sessão de IA.

Fluxo geral:

```
ROADMAP + specs/  →  [plan.md (este doc)]  →  todo.md  →  execução task a task  →  produto
```

---

## 1. Estado atual do projeto

| Item | Estado |
|---|---|
| `ROADMAP_AGENTES_IA_FINANCEIRO.md` | Pronto. Escopo de produto canônico. |
| `specs/00-contratos-compartilhados.md` | **Pronto.** Schema completo (cofres, faturas, splits, recorrentes, orçamentos, contatos). Revisado duas vezes (Sonnet). Fechado em 2026-05-14. |
| `specs/01-parte-a-infra-webhook.md` | Pronto. Refere-se a Parte A. |
| `specs/02-parte-b-pipeline-ia.md` | Pronto. Refere-se a Parte B. |
| `plan.md` (este doc) | Pronto. Workflow atualizado para disparo automático (sem cola de prompt pelo humano). |
| `todo.md` | **Pronto.** Gerado após fechamento de S-0.5 em 2026-05-14. |

**Sprint 0.5 fechada.** Execução pode começar pelo S-0.

---

## 1.5 Convenção de marcadores

Em qualquer checklist deste projeto (este `plan.md`, o futuro `todo.md`, e seções de aceite dentro de tasks), os marcadores significam:

| Marcador | Significado |
|---|---|
| `[ ]` | Não tocado — ninguém começou |
| `[*]` | Em desenvolvimento — sessão ativa, código sendo escrito ou em revisão |
| `[x]` | Concluído — passou na revisão Sonnet, foi revisado pelo humano e commitado |

**Transições válidas:**

- `[ ]` → `[*]` no momento em que a IA executora começa a tarefa (primeira ação após ler o prompt).
- `[*]` → `[x]` no momento em que humano commita após Sonnet review aprovado.
- `[x]` → `[ ]` apenas se a task for explicitamente reaberta (caso raro, ex: defeito descoberto depois).

Nenhuma outra transição é válida. Em particular, **não pular `[*]`** — o estado intermediário existe para que múltiplas sessões saibam que algo está em andamento.

---

## 2. Fontes de verdade e precedência

Quando duas fontes conflitarem, a IA **deve seguir a de maior precedência** e registrar o conflito em uma seção "Conflitos detectados" no fim do `todo.md`.

| # | Fonte | Tipo | Precedência |
|---|---|---|---:|
| 1 | `plan.md` (este doc) | Processo de trabalho | Mais alta — sobrescreve tudo em "como trabalhar" |
| 2 | `specs/00-contratos-compartilhados.md` | Contratos técnicos | Sobrescreve roadmap em decisões técnicas |
| 3 | `specs/01` e `specs/02` | Decomposição em fases | Sobrescreve roadmap em ordem de implementação |
| 4 | `ROADMAP_AGENTES_IA_FINANCEIRO.md` | Escopo de produto | Base. Define **o quê**, não **como**. |
| 5 | `todo.md` | Lista de execução | Output, nunca fonte. |

---

## 3. Pipeline completo

```
Etapa A — Pré-requisito (Sprint 0.5)
  Humano + IA atualizam specs/00 com schema expandido (cofres, faturas, splits,
  gastos fixos, orçamentos, contatos). Nada mais começa antes disso fechar.

Etapa B — Geração do todo.md
  IA lê: plan.md → specs/00 → specs/01 → specs/02 → ROADMAP
  IA aplica §6 (regras de geração) e §7 (template de task)
  IA produz todo.md com tasks atômicas, ordenadas por dependência,
  cada uma com prompt completo embutido

Etapa C — Validação humana
  Humano lê o todo.md inteiro, valida sequência e granularidade,
  ajusta se necessário, faz commit

Etapa D — Execução
  Para cada task em ordem:
    1. Humano diz "continuar" (ou "próxima task")
    2. Sonnet lê todo.md, identifica primeira task [ ], marca como [*]
    3. Sonnet spawna agente Opus com o prompt da task
    4. Opus executa seguindo §9 (regras de execução): testes, implementação, suite completa
    5. Sonnet revisa o trabalho (read-only) e reporta ao humano: veredicto + mensagem de commit
    6. Humano revisa diff e faz commit com a mensagem sugerida
    7. Humano confirma "commitado"; Sonnet marca task como [x] em commit separado

Etapa E — Encerramento de sprint
  Última task de cada sprint é uma "review" — IA roda suite completa,
  verifica integridade, gera checklist de validação para o humano
```

---

## 4. Sprints planejadas

| Sprint | Conteúdo | Pré-condição |
|---|---|---|
| **S-0** | Bootstrap do repo, deps, Prisma, vitest, env | Nenhuma |
| **S-0.5** | Expansão de schema + atualização de `specs/00` | Decisões fechadas em 2026-05-13 — falta apenas a tarefa mecânica de escrever as alterações em `specs/00` |
| **S-1** | Parte A (infra, webhook, persistência) | S-0.5 fechada |
| **S-2** | Parte B (pipeline IA, sanitização, financial service) | S-0.5 fechada (paralela à S-1) |
| **S-3** | Integração A↔B + testes end-to-end | S-1 e S-2 fechadas |
| **S-4** | Faturas de cartão (lógica + comandos) | S-3 fechada |
| **S-5** | Cofres + rendimento manual | S-3 fechada |
| **S-6** | Splits com contatos + pagamentos parciais | S-3 fechada |
| **S-7** | Gastos fixos + lembretes (cron) | S-3 fechada |
| **S-8** | Orçamentos por categoria + alertas | S-3 fechada |
| **S-9** | Áudio (Whisper) | S-3 fechada |
| **S-10** | Imagem (Llava + recibos) | S-3 fechada |
| **S-11** | Dashboard Next.js + projeção de saldo | S-4..S-8 fechadas |
| **S-12** | Backup, exportação, observabilidade | S-11 fechada |

**S-1 e S-2 podem ser executadas em paralelo** por sessões/IAs distintas após S-0.5.

---

## 5. Sprint 0.5 — Atualização de schema (obrigatória)

Esta sprint **bloqueia** todas as outras. As decisões de produto foram fechadas em 2026-05-13. O que resta é a tarefa mecânica de escrever o schema em `specs/00`.

### Decisões fechadas

- [x] **Cofres (vaults)** — modelagem como sub-conta via `Account.parentAccountId`. Suporte a múltiplos cofres curtos ("farmácia", "grana do cartão desse mês"). Rendimento registrado como transação manual de `income` no cofre. Criação/destruição de cofre é leve, sem cerimônia.
- [x] **Transferências** — vincular as duas pernas via `Transaction.transferGroupId`. Saída em uma conta + entrada em outra com mesmo `transferGroupId`.
- [x] **Faturas de cartão** — entidade `Invoice` com `closingDay`/`dueDay` no `Account` tipo `credit_card`. Compras vinculam-se à fatura aberta no momento da compra. Fatura aceita **vários pagamentos parciais ao longo do mês** (pré-pagamento), abatendo saldo conforme entram. Estado `open`/`closed`/`paid`.
- [x] **Contatos** — entidade `Contact` (esposa, futuros) separada de `User`. Não vira `User` no MVP.
- [x] **Splits** — `SharedSplit` ligando `Transaction` a `Contact` com `expectedAmount`. `SplitSettlement` registrando pagamentos parciais (esposa pode pagar em pedaços). Estado `open`/`settled`/`absorbed` — `absorbed` quando você decide cobrir o que faltou sem cobrar.
- [x] **Gastos fixos (recorrentes)** — `RecurringExpense` com periodicidade, valor esperado, categoria, dia esperado. Sem cron ainda — apenas estrutura. Cron entra em S-7.
- [x] **Orçamentos** — `Budget` (categoria + período + valor). Progresso é query, não campo.
- [x] **Lembretes** — `Reminder` (entidade) com tipo, agendamento, status. Execução via cron fica para S-7.

### O que falta nesta sprint

- [x] Reescrever `specs/00-contratos-compartilhados.md`:
  - Schema Prisma completo com todas as entidades novas e enums.
  - Fixtures expandidas cobrindo: transferência entre contas, pagamento parcial de fatura, split com pagamento parcial, registro de rendimento de cofre, alerta de orçamento, lembrete de gasto fixo.
  - Contrato `processMessage` revisado com novas intenções: `record_transfer`, `record_invoice_payment`, `record_split_settlement`, `record_yield`, `query_budget`, `query_invoice`, `confirm_recurring`.
- [x] Revisar `specs/01` e `specs/02` — adaptar se algo mudou. (Duas rodadas de revisão Sonnet + correções Opus aplicadas.)
- [x] Confirmação explícita do humano: **"schema fechado, pode gerar todo.md"**. (Confirmado em 2026-05-14.)

---

## 6. Regras para gerar `todo.md`

A IA encarregada de gerar o `todo.md` deve seguir estas regras na ordem.

### 6.1 Inputs obrigatórios (ler nesta ordem)

1. `plan.md` (este doc) — para entender o template e regras
2. `specs/00-contratos-compartilhados.md` — para schema, contratos, fixtures
3. `specs/01-parte-a-infra-webhook.md` — para escopo da Parte A
4. `specs/02-parte-b-pipeline-ia.md` — para escopo da Parte B
5. `ROADMAP_AGENTES_IA_FINANCEIRO.md` — para escopo de produto e features fora dos specs

### 6.2 Como quebrar em tasks

- Cada task deve caber em **uma sessão de execução** (alvo: 30 min a 2 h de trabalho de IA).
- Cada task deve ser **atômica** — todos os critérios de aceite são verificáveis ao final dela.
- Tasks de TDD vêm em **par**: `T-NNN-test` (escrever testes que falham) seguido por `T-NNN-impl` (implementar até passar).
- **Não inventar tasks** que não derivam dos inputs. Se um requisito não está em nenhum input, abrir uma nota em "Conflitos detectados" e **não criar a task**.
- **Não agrupar** tasks de naturezas diferentes (ex: nunca uma task que cria schema + escreve teste + implementa).

### 6.3 Identificadores e ordenação

- IDs no formato `T-001`, `T-002`, ... incrementais e únicos.
- Ordenação respeita dependências — uma task nunca aparece antes de uma dependência sua.
- Tasks de sprints diferentes não se intercalam, exceto quando explicitamente paralelas (S-1 e S-2).

### 6.4 Cobertura mínima

O `todo.md` está completo quando:

- Todas as features do roadmap estão cobertas por alguma task ou sprint marcada como "fora do MVP".
- Todos os critérios de aceite dos specs estão cobertos.
- Cada sprint tem ao menos uma task de "review" como última task.
- Cada arquivo do schema tem ao menos uma task associada (criação, migration, teste).

### 6.5 Última seção do `todo.md`

```markdown
## Conflitos detectados
(IA preenche aqui qualquer ambiguidade entre fontes, com referência ao trecho de cada uma)

## Tasks futuras (fora do MVP)
(features do roadmap não incluídas no escopo atual, com motivo)
```

---

## 7. Estrutura obrigatória de cada item do `todo.md`

Todo item segue **exatamente** este template. Sem campos extras, sem campos faltantes.

> **Marcador no cabeçalho:** `[ ]` não iniciado, `[*]` em desenvolvimento, `[x]` concluído. Ver §1.5 para regras de transição.

````markdown
## [ ] T-NNN: Título curto e ativo

| Campo | Valor |
|---|---|
| **Sprint** | S-X |
| **Camada** | Parte A \| Parte B \| Compartilhado \| Manual |
| **Tipo** | Setup \| TDD-Test \| TDD-Impl \| Refactor \| Doc \| Manual \| Review |
| **Depende de** | T-MMM, T-OOO (ou "nenhuma") |
| **Estimativa** | ~Xh |
| **Pode rodar em paralelo com** | T-PPP (ou "nenhuma") |

### Arquivos permitidos para criar/editar
- `src/...`
- `tests/...`

### Arquivos proibidos de tocar
- `prisma/schema.prisma` (a menos que a task seja explicitamente sobre schema)
- `shared/contract.ts`
- `shared/fixtures/*`
- Qualquer arquivo de outra Parte

### Critérios de aceite (verificáveis)
- [ ] ...
- [ ] ...

### Prompt pronto para execução
```
[prompt completo seguindo §8 — copiável para sessão limpa]
```

### Checklist de fechamento
- [ ] Todos os critérios de aceite verificados
- [ ] `pnpm test` 100% verde (não só os testes desta task)
- [ ] `pnpm lint` sem erros
- [ ] Commit feito com mensagem `T-NNN: <título>`
- [ ] Sem arquivos extras criados fora dos permitidos
- [ ] Esta task marcada com `[x]`

### Notas de execução
(preenchido após execução: o que foi feito, o que desviou, links para PRs/commits)
````

---

## 8. Template do prompt embutido em cada task

Este é o prompt que vai dentro do bloco "Prompt pronto para execução". Deve ser **autocontido** — funcionar em sessão limpa, sem histórico.

````markdown
PROJETO: Botfinancas — bot pessoal de finanças via Telegram com IA local (Ollama)
TAREFA: T-NNN — <título da task>
SPRINT: S-X
TIPO: <Setup | TDD-Test | TDD-Impl | ...>

═══════════════════════════════════════════════════════════
LEITURA OBRIGATÓRIA ANTES DE COMEÇAR
═══════════════════════════════════════════════════════════

1. Leia plan.md inteiro — especialmente §9 (regras de execução). Você DEVE seguir essas regras.
2. Leia specs/00-contratos-compartilhados.md, seções: <listar exatamente>
3. Leia specs/<0N>-<parte>.md, seções: <listar exatamente>
4. (Opcional) Roadmap, seção <X> para contexto.

NÃO leia outros arquivos exceto se esta tarefa explicitamente pedir.

═══════════════════════════════════════════════════════════
OBJETIVO DESTA TAREFA
═══════════════════════════════════════════════════════════

<1 a 2 frases descrevendo o que precisa estar verdadeiro ao final>

═══════════════════════════════════════════════════════════
ESCOPO — O QUE FAZER
═══════════════════════════════════════════════════════════

- <bullet específico e verificável>
- <bullet específico e verificável>

═══════════════════════════════════════════════════════════
FORA DE ESCOPO — O QUE NÃO FAZER
═══════════════════════════════════════════════════════════

- NÃO modificar arquivos fora da lista de "Arquivos permitidos" desta task.
- NÃO adicionar features extras, "melhorias", "refatorações úteis".
- NÃO criar utility files, helpers, types extras "porque vai precisar depois".
- NÃO ajustar schema, contract.ts ou fixtures (a menos que esta task seja sobre eles).
- <outras restrições específicas>

═══════════════════════════════════════════════════════════
ABORDAGEM — TDD (se aplicável)
═══════════════════════════════════════════════════════════

1. Escreva o(s) teste(s) listado(s) em "Critérios de aceite" em <caminho>
2. Rode `pnpm test <caminho>` — todos devem FALHAR (red)
3. Implemente o mínimo necessário em <caminho> para fazer passar
4. Rode `pnpm test <caminho>` — todos devem PASSAR (green)
5. Refatore se necessário, sem adicionar comportamento novo
6. Rode `pnpm test` (suite completa) — não pode ter regressão
7. Rode `pnpm lint` — sem erros

═══════════════════════════════════════════════════════════
ARQUIVOS PERMITIDOS (criar ou editar)
═══════════════════════════════════════════════════════════

- src/...
- tests/...

═══════════════════════════════════════════════════════════
ARQUIVOS PROIBIDOS (não tocar nesta task)
═══════════════════════════════════════════════════════════

- prisma/schema.prisma
- shared/contract.ts
- shared/fixtures/*
- <outros>

═══════════════════════════════════════════════════════════
CRITÉRIOS DE ACEITE (todos devem estar verdadeiros ao final)
═══════════════════════════════════════════════════════════

- [ ] <critério verificável>
- [ ] <critério verificável>
- [ ] `pnpm test` retorna 100% verde
- [ ] `pnpm lint` sem erros

═══════════════════════════════════════════════════════════
DEFINIÇÃO DE PRONTO (desta sessão Opus)
═══════════════════════════════════════════════════════════

Quando todos os critérios estiverem verdes:
1. Reporte resumo: o que foi feito, arquivos tocados, output dos testes finais.
2. NÃO faça commit. NÃO marque a task como [x].
3. Pare. A revisão e o commit ficam com o Sonnet e o humano.

═══════════════════════════════════════════════════════════
GATILHOS PARA PARAR E PERGUNTAR (não improvisar)
═══════════════════════════════════════════════════════════

- Algum arquivo de "Leitura obrigatória" não existe ou está vazio.
- Alguma dependência (T-MMM) parece não ter sido feita corretamente.
- Critério de aceite é ambíguo ou autocontraditório.
- Implementação exigiria modificar arquivo proibido.
- Teste passa, mas você não tem certeza de que cobre o que o critério pede.
- Tempo gasto > 2x a estimativa.

Em qualquer um desses casos: PARE, descreva o problema, peça orientação.
````

---

## 9. Regras de execução (anti-drift e anti-alucinação)

Cada regra tem **gatilho** (quando se aplica), **FAÇA** (ação correta) e **NÃO FAÇA** (armadilha comum).

### R-1 — Trabalhe sempre na primeira task disponível em ordem
- **Gatilho:** sempre que o Sonnet spawnar o Opus para execução.
- **FAÇA:** ler a task inteira (prompt já foi extraído pelo Sonnet). Executar apenas o que está no prompt. A marcação `[ ]` → `[*]` já foi feita pelo Sonnet antes de você ser iniciado.
- **NÃO FAÇA:** pular para uma task que parece "mais fácil" ou "mais interessante". Não fazer múltiplas tasks numa sessão. Não tocar tasks `[x]`. Não reeditar `todo.md`.

### R-2 — Apenas leia os arquivos listados em "Leitura obrigatória"
- **Gatilho:** ao entrar em uma task.
- **FAÇA:** abrir exatamente os arquivos e seções listados.
- **NÃO FAÇA:** "explorar" o repositório, abrir arquivos vizinhos por curiosidade. Cada arquivo a mais lido aumenta risco de drift e custo de contexto.

### R-3 — Apenas crie/edite os arquivos listados em "Arquivos permitidos"
- **Gatilho:** quando precisar escrever código.
- **FAÇA:** se descobrir que precisa de outro arquivo, **parar** e acionar o gatilho de "perguntar".
- **NÃO FAÇA:** criar utility/helper/type/index extra "porque vai ficar mais limpo". Refator vira task própria.

### R-4 — Nunca modifique fontes de verdade fora de tasks dedicadas
- **Gatilho:** ao tocar `prisma/schema.prisma`, `shared/contract.ts`, `shared/fixtures/*`, `specs/*`, `plan.md`, `roadmap`.
- **FAÇA:** confirmar que a task atual é explicitamente sobre esse arquivo. Se não, parar.
- **NÃO FAÇA:** "ajustar rapidinho" um campo no schema no meio de outra task.

### R-5 — Quando teste falha, conserte código, não teste
- **Gatilho:** teste vermelho.
- **FAÇA:** ler mensagem de erro, debugar implementação, corrigir.
- **NÃO FAÇA:** comentar teste, afrouxar assertion, adicionar mock pra "fazer passar", usar `--no-verify`.

### R-6 — Quando dependência prévia parece quebrada, pare
- **Gatilho:** task atual depende de T-MMM e algo de T-MMM parece ausente/errado.
- **FAÇA:** parar, reportar o gap, pedir orientação. Possivelmente reabrir T-MMM.
- **NÃO FAÇA:** "completar" o que falta dentro da task atual. Improvisar dependência mascara problemas.

### R-7 — Quando o prompt diz "não use X" mas você acha que precisa
- **Gatilho:** restrição do prompt parece atrapalhar.
- **FAÇA:** parar, registrar a dúvida, perguntar.
- **NÃO FAÇA:** usar mesmo assim e justificar depois. A restrição existe por uma razão — possivelmente uma decisão arquitetural anterior que você não viu.

### R-8 — Antes de marcar `[x]`, rode a suite COMPLETA
- **Gatilho:** quando achar que terminou.
- **FAÇA:** `pnpm test` (não `pnpm test <arquivo>`), `pnpm lint`, conferir todos os critérios de aceite um por um.
- **NÃO FAÇA:** marcar `[x]` baseado só nos testes desta task. Regressão silenciosa em outra parte é o pior bug.

### R-9 — Nunca invente API
- **Gatilho:** sempre que usar uma biblioteca.
- **FAÇA:** se não tem certeza absoluta da assinatura, ler doc oficial ou código fonte da lib em `node_modules`.
- **NÃO FAÇA:** assumir que `prisma.transaction.findOrCreate` existe (não existe). Não chutar nomes de métodos. Não inventar opções de config.

### R-10 — Tasks "Manual" param na geração de instrução
- **Gatilho:** task tipo `Manual` (criar bot no BotFather, configurar túnel, etc.).
- **FAÇA:** gerar instruções claras passo a passo para o humano executar; reportar e parar.
- **NÃO FAÇA:** tentar automatizar coisa que requer browser, conta externa, ou ação física.

### R-11 — Dois commits por task: implementação + marcação
- **Gatilho:** ao terminar uma task.
- **FAÇA:** após Sonnet review aprovado e revisão humana, dois commits separados: (1) implementação com mensagem `T-NNN: <título>`; (2) marcação `[*]` → `[x]` no `todo.md` com mensagem `T-NNN: marcar concluída`. Sempre humano commita, nunca a IA.
- **NÃO FAÇA:** acumular mudanças de várias tasks num commit; commitar antes da Sonnet review aprovar; misturar implementação com marcação no mesmo commit; commitar sem revisão humana.

### R-12 — Trabalho extra inesperado vira nova task
- **Gatilho:** durante uma task, você descobre que precisa fazer algo que não estava previsto.
- **FAÇA:** parar a task atual, descrever o trabalho extra, pedir para o humano abrir nova task `T-NNN-bis` ou ajustar o `todo.md`.
- **NÃO FAÇA:** fazer o trabalho extra dentro da task atual "pra não perder o pique".

### R-13 — Não delegue entendimento ao usuário
- **Gatilho:** quando pedir orientação.
- **FAÇA:** apresentar o problema concreto + 1 a 3 alternativas com trade-offs.
- **NÃO FAÇA:** mandar "o que prefere?" sem contexto. O humano não tem o estado da sua sessão na cabeça.

### R-14 — Se o tempo passar 2x da estimativa, pare
- **Gatilho:** task estimada em 1h, você está há 2h+.
- **FAÇA:** parar, reportar o que fez, o que falta, o que está travando.
- **NÃO FAÇA:** continuar martelando. Travamento longo é sinal de premissa errada, não de falta de esforço.

---

## 10. Definição de pronto (por task)

Uma task só pode ser marcada `[x]` quando **TODAS** as condições abaixo são verdade:

1. Todos os critérios de aceite estão checados.
2. `pnpm test` retorna 100% verde (suite completa, não só esta task).
3. `pnpm lint` sem erros nem warnings novos.
4. Nenhum arquivo fora dos "Arquivos permitidos" foi tocado.
5. **Sonnet aprovou na revisão automática** (ver §11.5). Ressalvas críticas resolvidas pelo Opus e revalidadas; ressalvas opcionais avaliadas e descartadas ou viradas em nova task.
6. Humano fez review do diff e aprovou.
7. Commit de implementação existe com mensagem `T-NNN: <título>`.
8. Marcador no `todo.md` virou `[x]` em commit separado `T-NNN: marcar concluída`.
9. Seção "Notas de execução" da task tem: arquivos modificados, hashes dos dois commits, observações, eventuais notas da Sonnet review.

---

## 11. Definição de pronto (por sprint)

Última task de cada sprint é tipo `Review`. Ela só fecha quando:

1. Todas as tasks da sprint estão `[x]`.
2. Suite de testes completa verde.
3. Smoke test manual passou (definido por sprint — ex: S-1 = mensagem real do Telegram persistida).
4. README da sprint atualizado se aplicável.
5. Sprint subsequente está desbloqueada (suas pré-condições foram atendidas).

---

## 11.5 Workflow por sessão de execução

O humano só precisa dar dois comandos por task: **"continuar"** (ou "próxima task") e **`git commit`** após aprovação. Todo o resto é automático.

### Fluxo normal

1. **Disparo.** Humano diz "continuar" (ou "próxima task") na sessão Claude Code em curso.
2. **Identificação.** Sonnet lê `todo.md`, encontra a primeira task `[ ]`, lê o prompt embutido nela.
3. **Marcação como em desenvolvimento.** Sonnet edita `todo.md`: `[ ]` → `[*]`. Não commita.
4. **Execução via agente Opus.** Sonnet spawna um agente Opus com o prompt da task. O Opus executa seguindo §9: escreve testes, implementa, roda suite completa, reporta de volta.
5. **Revisão Sonnet (read-only).** Sonnet lê os arquivos tocados pelo Opus e valida contra os critérios de aceite da task. Aponta: `aprovado`, ou problemas classificados como `crítico` / `opcional`. Sonnet **nunca escreve** durante revisão.
6. **Decisão.**
   - Se **aprovado**: Sonnet reporta ao humano o resumo + mensagem de commit sugerida. Vai para o passo 7.
   - Se **crítico**: Sonnet descreve o problema e spawna Opus para corrigir. Após correção, Sonnet revisa de novo (repete passo 5). Continua até aprovado.
   - Se **opcional**: Sonnet reporta, humano decide ignorar ou abrir task nova. Não trata na sessão atual.
7. **Revisão humana.** Humano lê o diff, valida critérios de aceite manualmente.
8. **Commit de implementação.** Humano faz `git commit` com a mensagem sugerida: `T-NNN: <título>`.
9. **Confirmação.** Humano diz "commitado" (ou similar). Sonnet edita `todo.md`: `[*]` → `[x]` e sugere o segundo commit: `T-NNN: marcar concluída`. Humano commita.

### Se a execução for interrompida no meio

- O `[*]` fica no `todo.md`. Na próxima sessão, humano diz "continuar" — Sonnet vê o `[*]`, lê as "Notas de execução", decide retomar ou spawnar Opus do zero.

### Por que Sonnet revisa Opus (não o contrário)

Modelo distinto do executor reduz vieses — Opus normaliza as próprias escolhas, Sonnet as questiona sem ter feito o trabalho. A troca de modelo é automática (agente distinto), sem ação do humano.

---

## 12. Exemplos de tasks (para calibrar a IA geradora)

### Exemplo A — Task de Setup

````markdown
## [ ] T-001: Bootstrap do projeto Next.js + TypeScript

| Campo | Valor |
|---|---|
| **Sprint** | S-0 |
| **Camada** | Compartilhado |
| **Tipo** | Setup |
| **Depende de** | nenhuma |
| **Estimativa** | ~30min |
| **Pode rodar em paralelo com** | nenhuma |

### Arquivos permitidos para criar/editar
- `package.json`
- `pnpm-lock.yaml`
- `tsconfig.json`
- `next.config.mjs`
- `.gitignore`
- `app/` (estrutura mínima do App Router)

### Arquivos proibidos de tocar
- Qualquer arquivo em `specs/`, `prisma/`, `shared/`, `prompts/`

### Critérios de aceite
- [ ] `package.json` declara `next@^14`, `typescript@^5`, `@types/node`, `@types/react`
- [ ] `tsconfig.json` tem `strict: true`, `noUncheckedIndexedAccess: true`
- [ ] `pnpm install` roda sem erro
- [ ] `pnpm dev` sobe servidor em :3000 e responde 200 em `/`
- [ ] Nenhum arquivo de exemplo do create-next-app permanece (limpar tudo o que não é esqueleto mínimo)

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-001 — Bootstrap do projeto Next.js + TypeScript
SPRINT: S-0
TIPO: Setup

LEITURA OBRIGATÓRIA:
1. plan.md (inteiro, especialmente §9)
2. specs/00-contratos-compartilhados.md, seção 1 (stack base) e seção 6 (estrutura)

OBJETIVO:
Criar o esqueleto Next.js + TypeScript do projeto, sem qualquer feature, pronto para receber as próximas tasks.

ESCOPO:
- Iniciar projeto com pnpm + Next.js 14 + TypeScript strict
- tsconfig conforme specs/00 §1
- Estrutura mínima do App Router (apenas page.tsx vazia)
- .gitignore padrão Node + Next + Prisma

FORA DE ESCOPO:
- NÃO instalar Prisma, Zod, Vitest, Pino — vão em tasks próprias
- NÃO criar nenhuma rota além do "/" inicial
- NÃO copiar exemplos do create-next-app (Tailwind, ESLint default, etc.)
- NÃO modificar specs/

ABORDAGEM:
1. pnpm create next-app . --typescript --no-tailwind --no-eslint --app --src-dir false --import-alias "@/*"
2. Limpar exemplos
3. Ajustar tsconfig.json
4. Ajustar .gitignore
5. Validar pnpm dev

CRITÉRIOS DE ACEITE: (mesmos da task)

DEFINIÇÃO DE PRONTO:
- Reporte arquivos criados, sugira commit "T-001: bootstrap Next.js + TypeScript", pare.
```

### Checklist de fechamento
- [ ] Critérios de aceite verificados
- [ ] `pnpm dev` testado manualmente
- [ ] Commit `T-001: bootstrap Next.js + TypeScript` feito
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)
````

### Exemplo B — Task de TDD-Test

````markdown
## [ ] T-014: Testes de extractJson

| Campo | Valor |
|---|---|
| **Sprint** | S-2 |
| **Camada** | Parte B |
| **Tipo** | TDD-Test |
| **Depende de** | T-013 (estrutura de pastas src/ai/ criada) |
| **Estimativa** | ~45min |
| **Pode rodar em paralelo com** | tasks de Parte A da S-1 |

### Arquivos permitidos para criar/editar
- `tests/ai/extract-json.test.ts`

### Arquivos proibidos de tocar
- `src/ai/extract-json.ts` (essa é a próxima task, T-015)
- Qualquer outro arquivo

### Critérios de aceite
- [ ] Arquivo `tests/ai/extract-json.test.ts` existe
- [ ] Contém os 11 `it` listados em specs/02 §9 (extract-json.test.ts)
- [ ] `pnpm test tests/ai/extract-json.test.ts` falha em 11 testes (red — função ainda não existe)
- [ ] Importa `extractJson` de `../../src/ai/extract-json` (mesmo que ainda não exista — vai falhar no import)

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-014 — Testes de extractJson (red phase do TDD)
SPRINT: S-2
TIPO: TDD-Test

LEITURA OBRIGATÓRIA:
1. plan.md (inteiro)
2. specs/02-parte-b-pipeline-ia.md, seção 9 (lista de testes — bloco extract-json.test.ts)
3. ROADMAP, seção 8.2 (estratégia de extração)

OBJETIVO:
Escrever a suite de testes do extractJson seguindo TDD. Os testes devem FALHAR ao final desta task — implementação vem em T-015.

ESCOPO:
- Criar tests/ai/extract-json.test.ts
- Implementar exatamente os 11 it() listados no spec
- Cada it() deve ter assertion concreta (não apenas it.todo)
- Importar de src/ai/extract-json (vai dar import error — esperado)

FORA DE ESCOPO:
- NÃO criar src/ai/extract-json.ts (próxima task)
- NÃO criar fixtures novas
- NÃO modificar nada além do arquivo de teste

ABORDAGEM:
1. Criar arquivo
2. Escrever os 11 testes com inputs e expected outputs concretos
3. Rodar pnpm test tests/ai/extract-json.test.ts
4. Confirmar: todos vermelhos por import error ou função ausente

ARQUIVOS PERMITIDOS:
- tests/ai/extract-json.test.ts

ARQUIVOS PROIBIDOS:
- src/ai/extract-json.ts
- qualquer outro

CRITÉRIOS DE ACEITE: (mesmos da task)

DEFINIÇÃO DE PRONTO:
- Reporte os 11 testes criados, output do pnpm test mostrando red, sugira commit "T-014: testes de extractJson (red)", pare.
```

### Checklist de fechamento
- [ ] Critérios de aceite verificados
- [ ] Output do `pnpm test` mostrando 11 falhas anexado nas notas
- [ ] Commit feito
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)
````

### Exemplo C — Task Manual

````markdown
## [ ] T-040: Criar bot no Telegram via BotFather

| Campo | Valor |
|---|---|
| **Sprint** | S-1 |
| **Camada** | Manual |
| **Tipo** | Manual |
| **Depende de** | T-039 (.env.example pronto) |
| **Estimativa** | ~10min |
| **Pode rodar em paralelo com** | qualquer task de código |

### Arquivos permitidos para criar/editar
- `.env.local` (apenas para colocar `TELEGRAM_BOT_TOKEN` e `TELEGRAM_WEBHOOK_SECRET`)

### Arquivos proibidos de tocar
- Tudo o resto

### Critérios de aceite
- [ ] Bot criado no @BotFather com nome de uso pessoal
- [ ] `TELEGRAM_BOT_TOKEN` salvo em `.env.local`
- [ ] `TELEGRAM_WEBHOOK_SECRET` gerado (32+ chars, openssl rand) e salvo
- [ ] `TELEGRAM_ALLOWED_USER_IDS` preenchido com o ID do humano
- [ ] `.env.local` está em `.gitignore`

### Prompt pronto para execução
```
PROJETO: Botfinancas
TAREFA: T-040 — Criar bot no Telegram (Manual)
SPRINT: S-1
TIPO: Manual

ESTA TASK É MANUAL — você (IA) NÃO executa, apenas gera instruções para o humano.

GERE PARA O HUMANO:
1. Passos exatos para falar com @BotFather no Telegram, criar bot, pegar token.
2. Comando shell para gerar o WEBHOOK_SECRET: openssl rand -hex 32
3. Como descobrir o próprio telegramUserId (sugerir @userinfobot).
4. Onde colar cada valor no .env.local.
5. Confirmação de que .env.local está no .gitignore.

NÃO EXECUTE comandos. NÃO crie arquivo .env.local você mesmo (humano cola valores reais).

REPORTE:
- Lista de instruções formatada para o humano seguir.
- Pare e aguarde humano confirmar conclusão.
```

### Checklist de fechamento
- [ ] Humano confirmou que executou todos os passos
- [ ] `.env.local` existe (não commitado)
- [ ] Esta task marcada `[x]`

### Notas de execução
(preencher após executar)
````

---

## 13. Checklist — `todo.md` está pronto pra começar?

Antes de iniciar a execução do `todo.md`, valide:

- [ ] Sprint 0.5 está fechada e specs estão atualizadas.
- [ ] Toda task tem ID único `T-NNN`.
- [ ] Toda task tem prompt completo embutido (não placeholder).
- [ ] Toda task tem dependências explícitas.
- [ ] Sequência de tasks respeita dependências.
- [ ] Cada sprint termina com uma task de `Review`.
- [ ] Seção "Conflitos detectados" está vazia OU foi resolvida com humano.
- [ ] Seção "Tasks futuras (fora do MVP)" lista features do roadmap não cobertas.
- [ ] Estimativa total bate com escopo (sanity check humano).

---

## 14. Quando atualizar este `plan.md`

Este documento é estável, mas pode ser atualizado quando:

- Uma regra (R-X) mostrar-se insuficiente na prática (drift detectado em alguma task).
- O template de task evoluir.
- Um novo tipo de task aparecer (ex: `Migration`, `Benchmark`).
- A precedência de fontes mudar.

**Não atualizar** este doc para mudanças de escopo do produto — escopo é roadmap + specs.

Cada atualização aqui deve ser feita em uma task explícita do tipo `Doc`, não no meio de outra task.
