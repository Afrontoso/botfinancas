# Botfinancas

Bot pessoal de finanças via Telegram com processamento por IA local (Ollama). Recebe mensagens de texto/voz, extrai transações financeiras e responde com confirmações e resumos.

---

## Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Node.js | 20 |
| pnpm | 9 |
| PostgreSQL | 16 |
| Tailscale | qualquer (para o túnel) |

---

## Setup do banco de dados

### 1. Criar os bancos

```bash
psql postgres -c "CREATE USER botfinancas WITH PASSWORD 'botfinancas';"
psql postgres -c "CREATE DATABASE botfinancas OWNER botfinancas;"
psql postgres -c "CREATE DATABASE botfinancas_test OWNER botfinancas;"
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha os valores:

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais reais (ver seção abaixo).

### 3. Rodar migrations

```bash
pnpm prisma migrate deploy
```

Para o banco de teste:

```bash
DATABASE_URL="postgresql://botfinancas:botfinancas@localhost:5432/botfinancas_test" \
  pnpm prisma migrate deploy
```

---

## Variáveis de ambiente

O arquivo `.env.example` contém todas as variáveis necessárias. Crie `.env.local` com os valores reais — **nunca commite esse arquivo**.

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL do banco PostgreSQL de desenvolvimento |
| `TEST_DATABASE_URL` | URL do banco de teste (separado do dev) |
| `TELEGRAM_BOT_TOKEN` | Token gerado pelo @BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | String secreta ≥32 chars para autenticar o webhook |
| `TELEGRAM_ALLOWED_USER_IDS` | IDs Telegram autorizados, separados por vírgula |
| `OLLAMA_BASE_URL` | URL base do Ollama (ex: `http://localhost:11434`) |
| `OLLAMA_TEXT_MODEL` | Modelo de texto (ex: `llama3.1`) |
| `LOG_LEVEL` | Nível de log pino: `debug`, `info`, `warn`, `error` |
| `NODE_ENV` | `development` ou `production` |

---

## Criar bot no Telegram (BotFather)

1. Abra o Telegram e fale com **@BotFather**
2. Envie `/newbot` e siga as instruções (escolha nome e username)
3. Copie o **token** exibido — ele vai para `TELEGRAM_BOT_TOKEN` no `.env.local`
4. Para descobrir seu `telegramUserId`, fale com **@userinfobot** — o número vai para `TELEGRAM_ALLOWED_USER_IDS`
5. Gere o `TELEGRAM_WEBHOOK_SECRET`:
   ```bash
   openssl rand -hex 32
   ```

---

## Configurar túnel (Tailscale Funnel)

O webhook do Telegram exige uma URL HTTPS pública. Use o Tailscale Funnel para expor o servidor local:

```bash
# Instalar (macOS)
brew install tailscale

# Autenticar
tailscale up

# Expor porta 3000 publicamente
tailscale funnel 3000
```

A URL pública exibida (formato `https://<hostname>.ts.net`) será usada no próximo passo.

Verifique que está funcionando (com `pnpm dev` rodando):

```bash
curl https://<sua-url>.ts.net/api/health
# → {"status":"ok"}
```

---

## Configurar webhook no Telegram

Com o servidor e o túnel rodando, registre o webhook:

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -d "url=https://<sua-url>.ts.net/api/webhooks/telegram" \
  -d "secret_token=<WEBHOOK_SECRET>"
```

Substitua `<BOT_TOKEN>` e `<WEBHOOK_SECRET>` pelos valores do `.env.local`. A resposta deve ser:

```json
{"ok":true,"description":"Webhook was set"}
```

Para verificar:

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

---

## Como rodar

### Desenvolvimento

```bash
pnpm install
pnpm dev          # servidor em http://localhost:3000
```

### Testes

```bash
pnpm test                          # suite completa
pnpm test tests/webhook/route      # arquivo específico
```

### Lint

```bash
pnpm lint
```

### Prisma

```bash
pnpm prisma generate               # regenerar client após mudanças no schema
pnpm prisma migrate dev --name X   # criar nova migration
pnpm prisma studio                 # interface visual do banco
```

---

## Segurança

- **Nunca commite `.env.local`** — ele está no `.gitignore`
- Não exponha o endpoint de health sem autenticação em produção
- O `TELEGRAM_WEBHOOK_SECRET` deve ter pelo menos 32 caracteres aleatórios
- Logs em nível `info`/acima nunca incluem o payload completo (pode conter dados pessoais)
- A allowlist (`TELEGRAM_ALLOWED_USER_IDS`) é o único mecanismo de controle de acesso — mantenha-a restrita ao seu próprio ID
