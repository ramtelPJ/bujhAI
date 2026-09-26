-- Adds a client-generated idempotency key so a retried/duplicated POST
-- /api/documents returns the already-created row instead of inserting a
-- duplicate (architecture-context.md "Idempotency key per upload attempt").

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "documents_idempotencyKey_key" ON "documents"("idempotencyKey");
