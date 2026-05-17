-- User.linkedAccountId aponta pro Account (NextAuth) que vinculou essa conta
-- Telegram à conta Google web. Único pra impedir múltiplos Users do Telegram
-- compartilhando a mesma conta web.

ALTER TABLE "User" ADD COLUMN "linkedAccountId" TEXT;

CREATE UNIQUE INDEX "User_linkedAccountId_key" ON "User"("linkedAccountId");
