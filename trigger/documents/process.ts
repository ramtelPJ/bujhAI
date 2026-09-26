import { task, tasks, logger } from "@trigger.dev/sdk";
import { withUser } from "@/lib/db/withUser";
import { readPrivateFile, uploadPrivateFile } from "@/lib/storage";
import { parseDocument } from "@/lib/documents/parse";
import type { analyzeDocumentTask } from "@/trigger/analysis/analyze";

/** Exact string required by authentiation-security.md §4. */
const PROCESSING_FAILED_MESSAGE = "We couldn't finish analyzing this document.";

export interface ProcessDocumentPayload {
  documentId: string;
  userId: string;
}

async function loadDocument(documentId: string, userId: string) {
  return withUser(userId, (tx) =>
    tx.document.findUnique({
      where: { id: documentId },
      select: { id: true, blobPath: true, mimeType: true, deletedAt: true },
    }),
  );
}

export const processDocument = task({
  id: "process-document",
  retry: { maxAttempts: 3, factor: 2, minTimeoutInMs: 2000, maxTimeoutInMs: 20_000, randomize: true },
  run: async (payload: ProcessDocumentPayload, { ctx }) => {
    const { documentId, userId } = payload;

    const document = await loadDocument(documentId, userId);
    if (!document || document.deletedAt) {
      logger.info("Document no longer exists — discarding", { documentId, runId: ctx.run.id });
      return { skipped: true };
    }

    const file = await readPrivateFile(document.blobPath);
    const parsed = await parseDocument({ data: file.data, mimeType: document.mimeType });

    // The document may have been deleted while OCR/parsing was in flight —
    // stop and discard rather than writing results for a gone document.
    const stillPresent = await loadDocument(documentId, userId);
    if (!stillPresent || stillPresent.deletedAt) {
      logger.info("Document deleted during processing — discarding results", {
        documentId,
        runId: ctx.run.id,
      });
      return { skipped: true };
    }

    const extractedTextBlobPath = await uploadPrivateFile(
      `documents/${userId}/${documentId}-pages.json`,
      new Blob([JSON.stringify(parsed.pages)], { type: "application/json" }),
      "application/json",
    );

    // processingStatus stays "processing" — the Feature 10 analysis task is
    // the next pipeline stage and owns the transition to "ready"/"failed".
    await withUser(userId, (tx) =>
      tx.document.update({
        where: { id: documentId },
        data: { pageCount: parsed.pageCount, extractedTextBlobPath, processingError: null },
      }),
    );

    await tasks.trigger<typeof analyzeDocumentTask>("analyze-document", { documentId, userId });

    logger.info("Document parsed", { documentId, pageCount: parsed.pageCount, runId: ctx.run.id });
    return { pageCount: parsed.pageCount };
  },
  // Only fires once retries are exhausted — a mid-attempt throw must not
  // mark the document failed while a retry is still likely to succeed.
  onFailure: async ({ payload, error }) => {
    const { documentId, userId } = payload;
    logger.error("Document processing failed", {
      documentId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    await withUser(userId, (tx) =>
      tx.document.update({
        where: { id: documentId },
        data: { processingStatus: "failed", processingError: PROCESSING_FAILED_MESSAGE },
      }),
    ).catch(() => {});
  },
});
