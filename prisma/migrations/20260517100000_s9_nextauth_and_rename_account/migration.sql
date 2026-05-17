-- ─── RENAME Account → FinancialAccount ──────────────────────────────────────
-- A tabela existente (conta financeira) é renomeada pra liberar o nome "Account"
-- ao NextAuth. Dados preservados; FKs e índices renomeados de acordo.

-- 1) Renomeia tabela
ALTER TABLE "Account" RENAME TO "FinancialAccount";

-- 2) Renomeia PK e constraints
ALTER TABLE "FinancialAccount" RENAME CONSTRAINT "Account_pkey" TO "FinancialAccount_pkey";
ALTER TABLE "FinancialAccount" RENAME CONSTRAINT "Account_parentAccountId_fkey" TO "FinancialAccount_parentAccountId_fkey";
ALTER TABLE "FinancialAccount" RENAME CONSTRAINT "Account_userId_fkey" TO "FinancialAccount_userId_fkey";

-- 3) Renomeia índices
ALTER INDEX "Account_userId_type_idx" RENAME TO "FinancialAccount_userId_type_idx";
ALTER INDEX "Account_parentAccountId_idx" RENAME TO "FinancialAccount_parentAccountId_idx";

-- 4) Atualiza FKs em outras tabelas (constraint segue apontando pra tabela renomeada
--    automaticamente; só renomeamos o nome da constraint pra coerência)
ALTER TABLE "Invoice"
  RENAME CONSTRAINT "Invoice_accountId_fkey" TO "Invoice_accountId_fkey_financial";
ALTER TABLE "Invoice"
  RENAME CONSTRAINT "Invoice_accountId_fkey_financial" TO "Invoice_accountId_fkey";

-- ─── User: campos do NextAuth ───────────────────────────────────────────────
ALTER TABLE "User"
  ADD COLUMN "email" TEXT,
  ADD COLUMN "emailVerified" TIMESTAMP(3),
  ADD COLUMN "image" TEXT;

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- ─── NextAuth tables ────────────────────────────────────────────────────────
CREATE TABLE "Account" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,

  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key"
  ON "Account"("provider", "providerAccountId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

ALTER TABLE "Account"
  ADD CONSTRAINT "Account_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key"
  ON "VerificationToken"("identifier", "token");
