import { withUser } from "@/lib/db/withUser";
import { assertCaseOwner, assertDocumentOwner } from "@/lib/auth/ownership";
import { AUTH_ERRORS } from "@/lib/auth/errors";
import { getShortLivedFileUrl } from "@/lib/storage";
import type { ActionStatus, CaseStatus, EvidenceState } from "@/lib/generated/prisma/enums";
import type { EvidenceValue } from "@/components/cases/fact-section";
import type { DeadlineView } from "@/components/cases/deadline-section";
import type { SubmissionMethodView } from "@/components/cases/submission-section";
import type { ChecklistItem } from "@/components/tasks/checklist";
import type { NoteView } from "@/components/cases/notes-section";

export interface CaseDetail {
  id: string;
  documentType: string;
  issuer: string | null;
  issueDate: string | null;
  caseStatus: CaseStatus;
  actionStatus: ActionStatus;
  whatThisIs: EvidenceValue | null;
  whyReceived: EvidenceValue | null;
  deadline: DeadlineView | null;
  tasks: ChecklistItem[];
  requiredMaterials: ChecklistItem[];
  submissionMethods: SubmissionMethodView[];
  consequences: EvidenceValue | null;
  uncertainties: string[];
  notes: NoteView[];
  /** Short-lived signed URL — never a permanent public link (architecture-context.md Access Model). */
  originalDocumentUrl: string;
}

export type CaseDetailResult =
  | { status: "processing" }
  | { status: "failed"; processingError: string | null }
  | { status: "ready"; caseDetail: CaseDetail };

interface ExtractionRow {
  field: string;
  value: unknown;
  evidenceState: EvidenceState;
  sourcePage: number | null;
}

function extractionValue(extractions: ExtractionRow[], field: string): EvidenceValue | null {
  const row = extractions.find((e) => e.field === field);
  if (!row) return null;
  const text =
    typeof row.value === "object" && row.value !== null && "text" in row.value
      ? String((row.value as { text: unknown }).text)
      : "";
  return { text, evidenceState: row.evidenceState, sourcePage: row.sourcePage ?? undefined };
}

/**
 * Deadline rows store a numeric confidence, not an evidenceState (architecture-context.md
 * only puts evidenceState on `extractions`) — DeadlineView (Feature 08) wants an evidence
 * tag, so this derives one from confidence.
 * ponytail: flat threshold, add a real evidenceState column on Deadline if this needs to
 * be more precise than "confident" vs "uncertain".
 */
function confidenceToEvidenceState(confidence: number): EvidenceState {
  return confidence >= 0.7 ? "explicit" : "inferred";
}

/** The dashboard's `primaryDeadline` pick, mapped back to its source row for description/evidence. */
function pickPrimaryDeadline<T extends { date: Date | null }>(deadlines: T[], primaryDeadline: Date | null): T | null {
  if (deadlines.length === 0) return null;
  if (primaryDeadline) {
    const match = deadlines.find((d) => d.date && d.date.getTime() === primaryDeadline.getTime());
    if (match) return match;
  }
  return deadlines[0];
}

async function loadReadyCase(caseId: string, userId: string): Promise<CaseDetail> {
  const caseRow = await withUser(userId, (tx) =>
    tx.case.findUnique({
      where: { id: caseId },
      include: {
        document: { select: { blobPath: true } },
        extractions: true,
        deadlines: true,
        tasks: true,
        requiredMaterials: true,
        submissionMethods: true,
      },
    }),
  );
  if (!caseRow) throw new Error(AUTH_ERRORS.notFound);

  const primaryDeadlineRow = pickPrimaryDeadline(caseRow.deadlines, caseRow.primaryDeadline);
  const originalDocumentUrl = await getShortLivedFileUrl(caseRow.document.blobPath);

  return {
    id: caseRow.id,
    documentType: caseRow.documentType,
    issuer: caseRow.issuer,
    issueDate: caseRow.issueDate?.toISOString() ?? null,
    caseStatus: caseRow.status,
    actionStatus: caseRow.actionStatus,
    whatThisIs: extractionValue(caseRow.extractions, "whatThisIs"),
    whyReceived: extractionValue(caseRow.extractions, "whyReceived"),
    deadline: primaryDeadlineRow
      ? {
          date: primaryDeadlineRow.date?.toISOString() ?? null,
          description: primaryDeadlineRow.description,
          evidenceState: confidenceToEvidenceState(primaryDeadlineRow.confidence.toNumber()),
          sourcePage: primaryDeadlineRow.sourcePage ?? undefined,
        }
      : null,
    tasks: caseRow.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description || undefined,
      required: t.required,
      completed: t.status === "completed",
      sourcePage: t.sourcePage ?? undefined,
    })),
    requiredMaterials: caseRow.requiredMaterials.map((m) => ({
      id: m.id,
      title: m.name,
      description: m.description ?? undefined,
      required: m.required,
      // No persisted completion state for materials (schema has none) — Checklist's
      // toggle for this list stays local-only, same as it was under mock data.
      completed: false,
      sourcePage: m.sourcePage ?? undefined,
    })),
    submissionMethods: caseRow.submissionMethods.map((s) => ({
      method: s.method,
      destination: s.destination ?? undefined,
      instructions: s.instructions ?? undefined,
      sourcePage: s.sourcePage ?? undefined,
    })),
    consequences: extractionValue(caseRow.extractions, "consequences"),
    uncertainties: caseRow.uncertainties,
    // Real caseNotes create/update is Feature 12 — nothing to read yet either way.
    notes: [],
    originalDocumentUrl,
  };
}

async function loadDocumentBackedResult(documentId: string, userId: string): Promise<CaseDetailResult> {
  const document = await withUser(userId, (tx) =>
    tx.document.findUnique({
      where: { id: documentId },
      select: { processingStatus: true, processingError: true, case: { select: { id: true } } },
    }),
  );
  if (!document) throw new Error(AUTH_ERRORS.notFound);

  // A ready document always has a case — support reaching it by either id.
  if (document.processingStatus === "ready" && document.case) {
    return { status: "ready", caseDetail: await loadReadyCase(document.case.id, userId) };
  }
  if (document.processingStatus === "failed") {
    return { status: "failed", processingError: document.processingError };
  }
  return { status: "processing" };
}

/** True if `id` is a case owned by `userId`; throws forbidden if it's a case owned by someone else. */
async function isOwnedCase(id: string, userId: string): Promise<boolean> {
  try {
    await assertCaseOwner(id, userId);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message === AUTH_ERRORS.forbidden) throw error;
    return false;
  }
}

/**
 * `/cases/[id]` accepts either a caseId (the common path, once analysis is
 * ready) or the source documentId (reachable before a case exists, e.g. from
 * a future dashboard link to a still-processing/failed document).
 */
export async function getCaseDetail(id: string, userId: string): Promise<CaseDetailResult> {
  if (await isOwnedCase(id, userId)) {
    return { status: "ready", caseDetail: await loadReadyCase(id, userId) };
  }
  await assertDocumentOwner(id, userId);
  return loadDocumentBackedResult(id, userId);
}
