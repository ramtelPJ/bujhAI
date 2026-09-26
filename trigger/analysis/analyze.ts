import { task, logger } from "@trigger.dev/sdk";
import { withUser } from "@/lib/db/withUser";
import { readPrivateFile } from "@/lib/storage";
import { analyzeDocument } from "@/lib/ai/analyze-document";
import { persistAnalysis } from "@/lib/documents/persist-analysis";
import { trackServerEvent } from "@/lib/analytics/server-events";
import type { ParsedPage } from "@/lib/documents/parse";

/** Exact string required by authentiation-security.md §4. */
const ANALYSIS_FAILED_MESSAGE = "We couldn't analyze this document right now.";

export interface AnalyzeDocumentPayload {
  documentId: string;
  userId: string;
}

async function loadDocument(documentId: string, userId: string) {
  return withUser(userId, (tx) =>
    tx.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        extractedTextBlobPath: true,
        deletedAt: true,
        case: { select: { id: true } },
      },
    }),
  );
}

export const analyzeDocumentTask = task({
  id: "analyze-document",
  retry: { maxAttempts: 3, factor: 2, minTimeoutInMs: 2000, maxTimeoutInMs: 20_000, randomize: true },
  run: async (payload: AnalyzeDocumentPayload, { ctx }) => {
    const { documentId, userId } = payload;

    const document = await loadDocument(documentId, userId);
    if (!document || document.deletedAt) {
      logger.info("Document no longer exists — discarding", { documentId, runId: ctx.run.id });
      return { skipped: true };
    }
    if (document.case) {
      logger.info("Case already exists — discarding duplicate analysis run", { documentId });
      return { skipped: true };
    }
    if (!document.extractedTextBlobPath) {
      throw new Error("Document has no extracted text to analyze");
    }

    // Pre-generated so the same id can be used in the started and completed
    // events, and set explicitly on the case row created in persistAnalysis.
    const caseId = crypto.randomUUID();
    trackServerEvent("document_analysis_started", { userId, caseId });

    const file = await readPrivateFile(document.extractedTextBlobPath);
    const pages: ParsedPage[] = JSON.parse(new TextDecoder().decode(file.data));

    const analysis = await analyzeDocument(pages);

    // The document may have been deleted while the model call was in
    // flight, or a case may already exist from a concurrent retry — stop
    // rather than persisting an orphaned or duplicate case.
    const stillPending = await loadDocument(documentId, userId);
    if (!stillPending || stillPending.deletedAt) {
      logger.info("Document deleted during analysis — discarding result", { documentId, runId: ctx.run.id });
      return { skipped: true };
    }
    if (stillPending.case) {
      logger.info("Case already exists — discarding duplicate analysis result", { documentId });
      return { skipped: true };
    }

    const result = await persistAnalysis({ documentId, userId, caseId, analysis });

    trackServerEvent("document_analysis_completed", {
      userId,
      caseId,
      actionStatus: result.actionStatus,
      urgency: result.urgency,
    });

    logger.info("Document analyzed", { documentId, caseId, runId: ctx.run.id });
    return { caseId };
  },
  // Only fires once retries are exhausted — a mid-attempt throw must not
  // mark the document failed while a retry is still likely to succeed.
  onFailure: async ({ payload }) => {
    const { documentId, userId } = payload;
    logger.error("Document analysis failed", { documentId });
    await withUser(userId, (tx) =>
      tx.document.update({
        where: { id: documentId },
        data: { processingStatus: "failed", processingError: ANALYSIS_FAILED_MESSAGE },
      }),
    ).catch(() => {});
  },
});
