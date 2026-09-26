import { tasks } from "@trigger.dev/sdk";
import type { processDocument } from "@/trigger/documents/process";
import { withUser } from "@/lib/db/withUser";

/** Exact string required by authentiation-security.md §4. */
const PROCESSING_FAILED_MESSAGE = "We couldn't finish analyzing this document.";

/**
 * Flips a document to "processing" and starts the Feature 09 pipeline job.
 * Shared by the upload route (first run) and the retry route (Feature 09's
 * "Retry button on failed state restarts the job"). If triggering itself
 * fails (e.g. Trigger.dev unreachable), marks the document "failed"
 * immediately rather than leaving it stuck in "processing" with nothing
 * actually running.
 */
export async function startProcessing(
  documentId: string,
  userId: string,
): Promise<"processing" | "failed"> {
  await withUser(userId, (tx) =>
    tx.document.update({
      where: { id: documentId },
      data: { processingStatus: "processing", processingError: null },
    }),
  );

  try {
    await tasks.trigger<typeof processDocument>("process-document", { documentId, userId });
    return "processing";
  } catch {
    await withUser(userId, (tx) =>
      tx.document.update({
        where: { id: documentId },
        data: { processingStatus: "failed", processingError: PROCESSING_FAILED_MESSAGE },
      }),
    ).catch(() => {});
    return "failed";
  }
}
