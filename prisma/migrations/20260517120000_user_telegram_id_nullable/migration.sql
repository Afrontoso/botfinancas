-- User do NextAuth (login Google) é criado sem telegramUserId — ele só ganha
-- esse vínculo depois via /vincular. Por isso a coluna passa a ser nullable.
-- A constraint @unique fica intacta (Postgres aceita múltiplos NULLs).

ALTER TABLE "User" ALTER COLUMN "telegramUserId" DROP NOT NULL;
