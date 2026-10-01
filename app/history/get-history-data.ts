import { withUser } from "@/lib/db/withUser";
import type { ProcessingStatus } from "@/lib/generated/prisma/enums";

export interface CompletedCaseItem {
  caseId: string;
  documentType: string;
  issuer: string | null;
  /** ISO date string. */
  completedDate: string;
}

export interface PreviousDocumentItem {
  documentId: string;
  /** null while still processing/failed — no case exists to link to yet. */
  caseId: string | null;
  label: string;
  processingStatus: ProcessingStatus;
  /** ISO date string. */
  uploadedAt: string;
}

export interface HistoryData {
  completedCases: CompletedCaseItem[];
  documents: PreviousDocumentItem[];
}

/**
 * History page (Feature 18). Every query filtered by `userId` via RLS (`withUser`).
 * A completed case's `updatedAt` doubles as its "completed date" — `Case` has no
 * dedicated `completedAt` column, but `PATCH /api/cases/[id]` (Feature 12) is the
 * only mutation that ever touches the case row itself once it exists, so `updatedAt`
 * on a `status: "completed"` case is exactly the moment it was marked complete.
 */
export async function getHistoryData(userId: string): Promise<HistoryData> {
  const completedCaseRows = await withUser(userId, (tx) =>
    tx.case.findMany({
      where: { userId, status: "completed" },
      orderBy: { updatedAt: "desc" },
      select: { id: true, documentType: true, issuer: true, updatedAt: true },
    }),
  );

  const documentRows = await withUser(userId, (tx) =>
    tx.document.findMany({
      where: { userId },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        fileName: true,
        processingStatus: true,
        uploadedAt: true,
        case: { select: { id: true, documentType: true } },
      },
    }),
  );

  return {
    completedCases: completedCaseRows.map((c) => ({
      caseId: c.id,
      documentType: c.documentType,
      issuer: c.issuer,
      completedDate: c.updatedAt.toISOString(),
    })),
    documents: documentRows.map((d) => ({
      documentId: d.id,
      caseId: d.case?.id ?? null,
      label: d.case?.documentType ?? d.fileName,
      processingStatus: d.processingStatus,
      uploadedAt: d.uploadedAt.toISOString(),
    })),
  };
}
