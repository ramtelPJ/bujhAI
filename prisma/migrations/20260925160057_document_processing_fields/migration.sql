-- Feature 09 (document processing pipeline): a Blob path to the derived,
-- normalized per-page text (never the original document), and a user-safe
-- message for the failed state.

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "extractedTextBlobPath" TEXT,
ADD COLUMN     "processingError" TEXT;
