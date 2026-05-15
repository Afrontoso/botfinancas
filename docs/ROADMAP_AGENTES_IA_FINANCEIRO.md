# Roadmap: Sistema de Controle Financeiro com Agentes de IA Locais

## 1. Visao Geral

Sistema local de controle financeiro pessoal operando em um MacBook M5 como servidor privado, com entrada principal via Telegram e processamento por modelos locais usando Ollama.

O objetivo e permitir que o usuario registre despesas, receitas, consultas e anexos multimodais por mensagens de texto, audio ou imagem, mantendo os dados financeiros persistidos em PostgreSQL e visualizados posteriormente em um dashboard Next.js.

---

## 2. Stack Tecnica

| Camada | Tecnologia |
|---|---|
| Interface mobile | Telegram Bot |
| Backend/API | Next.js API Routes ou Route Handlers |
| ORM | Prisma |
| Banco de dados | PostgreSQL |
| LLM local | Ollama |
| Modelos de texto | Llama 3 / Mistral / Phi conforme benchmark local |
| Visao computacional | Llava |
| Transcricao de audio | Whisper local |
| Conectividade externa | Tailscale Funnel ou Cloudflare Tunnel |
| Validacao de dados | Zod |
| Observabilidade local | Logs estruturados + dashboard admin |

---

## 3. Requisitos Funcionais

### 3.1 Entrada de Dados

O sistema deve permitir registrar transacoes financeiras via Telegram:

- Texto livre:
  - "Gastei 50 reais no mercado ontem"
  - "Recebi 3000 de salario"
  - "Paguei 120 no cartao"
- Audio:
  - Usuario envia audio pelo Telegram.
  - Sistema transcreve com Whisper.
  - Texto transcrito segue o mesmo pipeline de interpretacao.
- Imagem:
  - Foto de recibo, nota fiscal ou comprovante.
  - Sistema usa Llava/OCR para extrair informacoes relevantes.

### 3.2 Classificacao Financeira

O sistema deve identificar:

- Tipo da transacao:
  - `expense`
  - `income`
  - `transfer`
  - `adjustment`
- Valor.
- Data.
- Categoria.
- Descricao.
- Forma de pagamento.
- Conta ou carteira.
- Parcelamento, quando aplicavel.
- Confianca da inferencia.

### 3.3 Persistencia

O sistema deve salvar dados estruturados no PostgreSQL usando Prisma.

Entidades principais:

- `User`
- `Account`
- `Transaction`
- `Category`
- `MessageLog`
- `AiInference`
- `MemoryEntry`
- `Attachment`

### 3.4 Consulta por Linguagem Natural

O usuario podera perguntar:

- "Quanto gastei esse mes?"
- "Quanto sobrou do meu salario?"
- "Me mostra gastos com mercado"
- "Qual foi minha maior despesa da semana?"
- "Quanto gastei ontem?"

O sistema deve consultar o banco de dados, nao depender apenas da memoria do modelo.

### 3.5 Dashboard Web

O dashboard Next.js deve exibir:

- Saldo atual.
- Receitas e despesas por periodo.
- Gastos por categoria.
- Ultimas transacoes.
- Filtros por data, categoria, conta e tipo.
- Correcao manual de lancamentos.
- Historico de mensagens processadas pela IA.

---

## 4. Requisitos Nao-Funcionais

### 4.1 Privacidade

- Todo processamento sensivel deve ocorrer localmente.
- Dados financeiros permanecem no PostgreSQL local.
- Modelos via Ollama devem rodar no MacBook.
- Evitar envio de mensagens financeiras para APIs externas.
- Telegram ainda e um ponto externo inevitavel, entao nao deve ser tratado como canal totalmente privado.

### 4.2 Seguranca

- Webhook deve validar `secret_token` do Telegram.
- Endpoint do webhook nao deve aceitar requisicoes sem autenticacao.
- Dashboard deve ter autenticacao.
- Variaveis sensiveis devem ficar em `.env`.
- O tunel deve expor apenas a rota necessaria.
- Logs nao devem salvar tokens, headers sensiveis ou dados bancarios completos.

### 4.3 Latencia

Metas iniciais:

| Operacao | Meta |
|---|---|
| Mensagem simples de texto | 1 a 5 segundos |
| Audio curto | 3 a 10 segundos |
| Imagem/recibo | 5 a 20 segundos |
| Consulta ao dashboard | abaixo de 500 ms |

Estrategias:

- Usar modelos menores quando possivel.
- Separar tarefas rapidas de tarefas pesadas.
- Processar midia de forma assincrona.
- Salvar estado intermediario no banco.
- Criar fila local se necessario.

### 4.4 Confiabilidade

- Nenhuma transacao deve ser salva sem validacao.
- Toda inferencia da IA deve guardar o payload bruto.
- Toda resposta estruturada deve passar por Zod.
- Em caso de baixa confianca, pedir confirmacao ao usuario.
- Erros de IA nao devem quebrar o webhook.

### 4.5 Persistencia e Backup

- PostgreSQL deve ter backup periodico.
- Backup local criptografado recomendado.
- Exportacao CSV/JSON deve ser prevista.
- Migracoes Prisma devem ser versionadas.

---

## 5. Arquitetura do Sistema

### 5.1 Fluxo Principal

```text
Telegram
   |
   | Webhook HTTPS
   v
Tunnel: Tailscale ou Cloudflare
   |
   v
Next.js API Route
   |
   | valida secret_token
   | normaliza mensagem
   v
Message Processor
   |
   | texto / audio / imagem
   v
AI Orchestrator
   |
   | chama Ollama / Whisper / Llava
   v
Sanitization Layer
   |
   | extrai JSON
   | valida com Zod
   | aplica regras de negocio
   v
Prisma
   |
   v
PostgreSQL
   |
   v
Resposta para Telegram
```

### 5.2 Componentes

#### Telegram Webhook Handler

Responsabilidades:

- Receber eventos do Telegram.
- Validar `secret_token`.
- Identificar usuario.
- Detectar tipo de mensagem.
- Salvar mensagem bruta em `MessageLog`.
- Enfileirar ou executar processamento.

#### Message Processor

Responsabilidades:

- Normalizar texto.
- Baixar arquivos do Telegram quando necessario.
- Encaminhar audio para Whisper.
- Encaminhar imagem para Llava.
- Transformar tudo em uma representacao textual inicial.

#### AI Orchestrator

Responsabilidades:

- Escolher modelo adequado.
- Montar prompt.
- Injetar contexto relevante.
- Chamar Ollama.
- Registrar entrada e saida da inferencia.

#### Sanitization Layer

Responsabilidades:

- Extrair JSON da resposta da IA.
- Remover texto extra antes/depois do JSON.
- Validar schema com Zod.
- Rejeitar campos invalidos.
- Aplicar defaults.
- Calcular confianca.
- Decidir se precisa de confirmacao humana.

#### Financial Service

Responsabilidades:

- Criar transacoes.
- Consultar saldos.
- Agregar gastos.
- Resolver categorias.
- Aplicar regras financeiras.
- Persistir via Prisma.

#### Memory Service

Responsabilidades:

- Guardar contexto de curto prazo.
- Buscar mensagens recentes.
- Buscar ultimas transacoes.
- Resolver referencias temporais como "ontem", "esse mes", "ultimo salario".
- Evitar depender exclusivamente do contexto do LLM.

---

## 6. Modelagem Inicial do Banco

### 6.1 Entidades Principais

#### User

```text
id
telegramUserId
name
timezone
defaultCurrency
createdAt
updatedAt
```

#### Account

```text
id
userId
name
type
currency
initialBalance
createdAt
updatedAt
```

Tipos possiveis:

```text
checking
cash
credit_card
savings
investment
wallet
```

#### Category

```text
id
userId
name
type
parentId
createdAt
```

#### Transaction

```text
id
userId
accountId
categoryId
type
amount
currency
description
transactionDate
paymentMethod
installmentNumber
installmentTotal
source
confidence
createdAt
updatedAt
```

#### MessageLog

```text
id
userId
telegramMessageId
chatId
messageType
rawPayload
normalizedText
createdAt
```

#### AiInference

```text
id
userId
messageLogId
model
promptVersion
input
rawOutput
parsedOutput
status
error
latencyMs
createdAt
```

#### MemoryEntry

```text
id
userId
scope
content
metadata
expiresAt
createdAt
```

---

## 7. Definicao dos Modelos de IA

### 7.1 Llama 3 ou Modelo de Texto

Uso principal:

- Interpretar mensagens financeiras em texto.
- Converter linguagem natural em JSON.
- Responder perguntas financeiras.
- Classificar categorias.

Criterios de escolha:

- Boa qualidade em portugues.
- Baixa latencia no MacBook M5.
- Boa aderencia a instrucoes de JSON.
- Capacidade de seguir schema.
- Consumo aceitavel de memoria.

Modelos candidatos:

```text
llama3
llama3.1
mistral
phi3
gemma
```

Estrategia recomendada:

- Comecar com um modelo menor e rapido.
- Medir erro de parsing e latencia.
- So subir para modelo maior se a qualidade for insuficiente.

### 7.2 Llava para Visao

Uso principal:

- Interpretar recibos.
- Extrair valor total.
- Identificar estabelecimento.
- Identificar data.
- Identificar itens, se necessario.

Criterios de uso:

- Usar apenas quando houver imagem.
- Nao confiar cegamente na saida.
- Sempre passar a saida por validacao.
- Para recibos complexos, salvar como pendente de confirmacao.

Saida esperada:

```json
{
  "merchant": "Mercado Exemplo",
  "total": 87.45,
  "date": "2026-04-27",
  "items": [],
  "confidence": 0.74
}
```

### 7.3 Whisper para Audio

Uso principal:

- Transcrever mensagens de voz.
- Gerar texto intermediario.
- Encaminhar o texto transcrito ao mesmo parser usado para mensagens digitadas.

Criterios de escolha:

- Qualidade em portugues.
- Tempo de transcricao.
- Execucao local.
- Robustez com audio de Telegram.

Pipeline:

```text
Telegram Voice
   -> download .oga/.ogg
   -> conversao se necessario
   -> Whisper
   -> texto transcrito
   -> LLM textual
   -> JSON validado
```

---

## 8. Sanitizacao de Resposta da IA

Este ponto deve ser tratado como componente obrigatorio, nao como detalhe.

### 8.1 Problema

Modelos locais podem responder assim:

```text
Claro! Aqui esta o JSON:

{
  "type": "expense",
  "amount": 50,
  "category": "Mercado"
}

Espero ter ajudado.
```

Esse conteudo nao pode ir diretamente para o Prisma.

### 8.2 Estrategia

#### Camada 1: Prompt restritivo

O prompt deve instruir:

```text
Responda exclusivamente com JSON valido.
Nao use Markdown.
Nao explique.
Nao inclua texto antes ou depois.
```

#### Camada 2: Extracao

Aplicar extracao do primeiro bloco JSON valido:

```ts
function extractJson(raw: string): unknown {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found");
  return JSON.parse(match[0]);
}
```

#### Camada 3: Validacao com Zod

```ts
const TransactionSchema = z.object({
  type: z.enum(["expense", "income", "transfer", "adjustment"]),
  amount: z.number().positive(),
  currency: z.string().default("BRL"),
  description: z.string().min(1),
  category: z.string().optional(),
  transactionDate: z.string(),
  confidence: z.number().min(0).max(1)
});
```

#### Camada 4: Regras de negocio

Validar:

- Valor maior que zero.
- Data plausivel.
- Categoria permitida ou nova categoria sugerida.
- Usuario autorizado.
- Conta existente.
- Confianca minima.

#### Camada 5: Confirmacao humana

Se `confidence < 0.75`, responder no Telegram:

```text
Entendi: despesa de R$ 50,00 em Mercado, ontem. Confirmar?
```

---

## 9. Gerenciamento de Contexto e Memoria

### 9.1 Principio

A memoria principal deve estar no PostgreSQL, nao no prompt do modelo.

O LLM deve receber apenas contexto relevante e temporario.

### 9.2 Short-Term Memory

Guardar em `MemoryEntry`:

- Ultimas mensagens do usuario.
- Ultimas transacoes.
- Correcoes recentes.
- Preferencias inferidas.
- Estado de confirmacoes pendentes.

Exemplo:

```json
{
  "lastTransactionId": "tx_123",
  "pendingConfirmation": true,
  "interpretedAction": "create_expense",
  "expiresAt": "2026-04-27T23:59:00Z"
}
```

### 9.3 Contexto para perguntas

Para pergunta como:

```text
Quanto sobrou esse mes?
```

O sistema deve:

1. Identificar intencao: consulta de saldo.
2. Resolver periodo: mes atual.
3. Consultar PostgreSQL.
4. Passar numeros consolidados ao LLM apenas para formatar resposta.
5. Retornar resposta ao Telegram.

O modelo nao deve inventar valores.

---

## 10. Seguranca do Tunel e Webhook

### 10.1 Telegram Secret Token

Ao registrar o webhook:

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -d "url=https://seu-dominio/webhook/telegram" \
  -d "secret_token=<SECRET_FORTE>"
```

No backend:

```ts
const secret = request.headers.get("x-telegram-bot-api-secret-token");

if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
  return new Response("Unauthorized", { status: 401 });
}
```

### 10.2 Recomendacoes

- Usar URL dificil de adivinhar.
- Expor somente rota do webhook.
- Rate limit por IP/chat.
- Validar `telegramUserId` permitido.
- Nao deixar dashboard publico sem login.
- Separar token do bot e secret do webhook.
- Rotacionar secrets periodicamente.

---

## 11. Backlog por Fases

## Fase 1: Setup do Ambiente e Tunel

### Objetivo

Preparar infraestrutura local, banco, tunel HTTPS e webhook seguro.

### Tarefas

- Criar projeto Next.js.
- Configurar TypeScript.
- Configurar Prisma.
- Subir PostgreSQL local.
- Criar schema inicial.
- Configurar `.env`.
- Instalar Ollama.
- Baixar primeiro modelo de texto.
- Criar bot no Telegram via BotFather.
- Configurar Tailscale ou Cloudflare Tunnel.
- Criar rota `/api/webhooks/telegram`.
- Validar `secret_token`.
- Registrar webhook no Telegram.
- Criar endpoint `/api/health`.

### Criterios de aceite

- Telegram consegue chamar o webhook.
- Requisicoes sem `secret_token` retornam `401`.
- Banco conecta via Prisma.
- Ollama responde localmente.
- Logs basicos registram eventos recebidos.

## Fase 2: Integracao Telegram <-> Ollama com Texto

### Objetivo

Registrar transacoes financeiras a partir de mensagens de texto.

### Tarefas

- Implementar parser de mensagens Telegram.
- Criar `MessageLog`.
- Criar servico de chamada ao Ollama.
- Criar prompt inicial de extracao financeira.
- Implementar extracao de JSON.
- Implementar validacao com Zod.
- Criar servico de transacoes.
- Salvar transacoes com Prisma.
- Responder confirmacao no Telegram.
- Criar fluxo para baixa confianca.
- Criar testes unitarios do parser.

### Criterios de aceite

Entrada:

```text
Gastei 50 reais no mercado ontem
```

Saida esperada:

```text
Despesa registrada: R$ 50,00 em Mercado.
```

Persistencia esperada:

```text
Transaction.type = expense
Transaction.amount = 50
Transaction.category = Mercado
Transaction.transactionDate = data de ontem
```

## Fase 3: Processamento Multimodal

### Objetivo

Adicionar suporte para audio e imagem.

### Tarefas de audio

- Detectar mensagens de voz.
- Baixar arquivo do Telegram.
- Converter formato se necessario.
- Transcrever com Whisper.
- Salvar transcricao.
- Reutilizar pipeline textual.
- Medir latencia.

### Tarefas de imagem

- Detectar foto/documento.
- Baixar imagem.
- Enviar para Llava.
- Extrair informacoes financeiras.
- Validar JSON.
- Criar transacao pendente quando confianca for baixa.
- Permitir confirmacao pelo Telegram.

### Criterios de aceite

- Audio curto vira transacao financeira.
- Foto de recibo gera sugestao estruturada.
- Nenhuma inferencia multimodal salva dados sem validacao.
- Casos incertos pedem confirmacao.

## Fase 4: Dashboard Next.js

### Objetivo

Criar interface web para visualizacao e correcao dos dados.

### Tarefas

- Criar autenticacao do dashboard.
- Criar pagina de visao geral.
- Criar tabela de transacoes.
- Criar filtros por periodo, categoria e conta.
- Criar graficos de despesas por categoria.
- Criar tela de edicao de transacao.
- Criar tela de logs de IA.
- Criar tela de prompts e versoes.
- Adicionar exportacao CSV.
- Adicionar backup manual.

### Criterios de aceite

- Usuario visualiza saldo e movimentacoes.
- Usuario corrige lancamentos incorretos.
- Usuario audita o que a IA interpretou.
- Dashboard nao fica exposto sem autenticacao.

---

## 12. Estrategia de Testes

### 12.1 Testes Unitarios

Prioridade alta:

- Extracao de JSON da resposta da IA.
- Validacao Zod.
- Conversao de datas relativas.
- Normalizacao de valores monetarios.
- Classificacao de tipo de transacao.
- Regras de confianca.

Casos obrigatorios:

```text
"Gastei 50 no mercado"
"Recebi 3000 de salario"
"Paguei 120 ontem"
"Comprei algo por cinquenta reais"
"gastei R$ 1.234,56 no cartao"
```

### 12.2 Testes de Integracao

Testar:

- Webhook do Telegram com secret valido.
- Webhook sem secret.
- Webhook com secret invalido.
- Criacao de `MessageLog`.
- Criacao de `Transaction`.
- Resposta enviada ao Telegram.
- Falha do Ollama.
- Resposta invalida da IA.

### 12.3 Testes com Fixtures de IA

Criar fixtures para respostas problematicas:

```text
Resposta com Markdown
Resposta com texto antes do JSON
Resposta com JSON invalido
Resposta com valor negativo
Resposta sem data
Resposta com categoria inexistente
Resposta com confidence baixo
```

### 12.4 Testes Manuais

Checklist:

- Enviar texto simples.
- Enviar texto ambiguo.
- Enviar audio curto.
- Enviar foto de recibo.
- Perguntar resumo do mes.
- Tentar chamar webhook sem secret.
- Desligar Ollama e observar comportamento.
- Reiniciar servidor e verificar persistencia.

---

## 13. Prompt Engineering

### 13.1 Estrutura Recomendada

Manter prompts versionados em arquivos:

```text
/prompts
  transaction-extraction.v1.md
  transaction-extraction.v2.md
  financial-query.v1.md
  receipt-vision.v1.md
  categorization.v1.md
```

### 13.2 Prompt de Extracao Financeira

Exemplo:

```text
Voce e um parser financeiro.

Extraia uma transacao financeira da mensagem do usuario.

Responda exclusivamente com JSON valido.
Nao use Markdown.
Nao explique.
Nao inclua texto antes ou depois.

Schema esperado:
{
  "intent": "create_transaction",
  "type": "expense | income | transfer | adjustment",
  "amount": number,
  "currency": "BRL",
  "description": string,
  "category": string,
  "transactionDate": "YYYY-MM-DD",
  "paymentMethod": string | null,
  "confidence": number
}

Mensagem do usuario:
{{message}}

Data atual:
{{currentDate}}

Contexto relevante:
{{context}}
```

### 13.3 Boas Praticas

- Versionar todo prompt.
- Salvar `promptVersion` em `AiInference`.
- Criar fixtures por versao.
- Medir taxa de JSON invalido por modelo.
- Nao colocar contexto excessivo.
- Preferir instrucoes objetivas.
- Separar prompt de extracao e prompt de resposta ao usuario.

---

## 14. README Profissional

Estrutura sugerida:

```text
# Local AI Finance Bot

## Overview
Descricao curta do projeto.

## Architecture
Diagrama do fluxo Telegram -> Tunnel -> Next.js -> Ollama -> PostgreSQL.

## Tech Stack
Lista das tecnologias usadas.

## Requirements
Requisitos de hardware, software e ambiente.

## Setup
Passos de instalacao.

## Environment Variables
Tabela com variaveis necessarias.

## Database
Como rodar migrations e seed.

## Telegram Bot Setup
Como criar bot, configurar webhook e secret_token.

## Ollama Setup
Modelos necessarios e comandos para instalacao.

## Running Locally
Como iniciar o servidor.

## Testing
Como rodar testes unitarios e integracao.

## Prompt Engineering
Como os prompts sao organizados e versionados.

## Security
Cuidados com tunel, tokens e dashboard.

## Backup
Estrategia de backup do PostgreSQL.

## Roadmap
Fases futuras.

## Troubleshooting
Erros comuns e solucoes.
```

---

## 15. Riscos Tecnicos

| Risco | Impacto | Mitigacao |
|---|---:|---|
| IA gera JSON invalido | Alto | Regex + Zod + fixtures |
| Modelo local lento | Medio | Benchmark e modelos menores |
| Recibos ambiguos | Medio | Confirmacao humana |
| Webhook exposto | Alto | `secret_token`, allowlist e rate limit |
| Perda de dados | Alto | Backup PostgreSQL |
| Contexto incorreto | Medio | Memoria no banco, nao no LLM |
| Categorias inconsistentes | Medio | Normalizacao e sugestoes controladas |

---

## 16. Ordem Recomendada de Implementacao

1. Criar base Next.js + Prisma + PostgreSQL.
2. Criar webhook seguro do Telegram.
3. Persistir `MessageLog`.
4. Integrar Ollama com texto.
5. Implementar extracao JSON + Zod.
6. Criar `Transaction`.
7. Adicionar confirmacao de baixa confianca.
8. Implementar memoria curta no PostgreSQL.
9. Adicionar consultas financeiras.
10. Adicionar audio com Whisper.
11. Adicionar imagem com Llava.
12. Criar dashboard.
13. Criar auditoria de prompts e inferencias.
14. Automatizar testes e backups.

---

## 17. Marco Inicial de MVP

O MVP deve ser considerado pronto quando:

- O usuario envia uma mensagem de texto pelo Telegram.
- O webhook valida o `secret_token`.
- A mensagem e salva em `MessageLog`.
- Ollama interpreta a transacao.
- A resposta e sanitizada e validada com Zod.
- A transacao e salva no PostgreSQL.
- O bot responde confirmando o lancamento.
- Uma pergunta simples como "quanto gastei hoje?" consulta o banco e retorna o total correto.

Esse MVP cobre o nucleo do sistema: entrada mobile, IA local, validacao, persistencia e resposta.
