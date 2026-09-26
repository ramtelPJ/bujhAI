import type { DocumentAnalysis } from "@/lib/ai/schema";
import { withUser } from "@/lib/db/withUser";
import type { ActionStatus } from "@/lib/generated/prisma/enums";

function toDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Earliest dated deadline — what the dashboard sorts/groups by (Feature 17). */
function primaryDeadlineFrom(deadlines: DocumentAnalysis["deadlines"]): Date | null {
  const dates = deadlines.map((d) => toDate(d.date)).filter((d): d is Date => d !== null);
  if (dates.length === 0) return null;
  return new Date(Math.min(...dates.map((d) => d.getTime())));
}

interface PersistAnalysisParams {
  documentId: string;
  userId: string;
  /** Pre-generated so it can be included in the document_analysis_started event. */
  caseId: string;
  analysis: DocumentAnalysis;
}

/**
 * Persists a validated DocumentAnalysis as the case and its child records in
 * one transaction, then flips the document to "ready" — the last step of the
 * Feature 09 → 10 pipeline (architecture-context.md Document Processing Model).
 */
export async function persistAnalysis({ documentId, userId, caseId, analysis }: PersistAnalysisParams) {
  const primaryDeadline = primaryDeadlineFrom(analysis.deadlines);
  // Never leave a past deadline showing as still-actionable, regardless of
  // what the model itself reported for action.status.
  const actionStatus: ActionStatus =
    primaryDeadline && primaryDeadline.getTime() < Date.now() ? "deadline_passed" : analysis.action.status;

  await withUser(userId, async (tx) => {
    await tx.case.create({
      data: {
        id: caseId,
        userId,
        documentId,
        documentType: analysis.document.type,
        issuer: analysis.document.issuer ?? null,
        recipient: analysis.document.recipient ?? null,
        issueDate: toDate(analysis.document.issueDate),
        actionStatus,
        urgency: analysis.action.urgency,
        summary: analysis.action.summary,
        primaryDeadline,
        status: "active",
        uncertainties: analysis.uncertainties,
      },
    });

    await tx.extraction.createMany({
      data: [
        { field: "whatThisIs", ...analysis.explanation.whatThisIs },
        { field: "whyReceived", ...analysis.explanation.whyReceived },
        { field: "consequences", ...analysis.consequences },
      ].map((f) => ({
        caseId,
        field: f.field,
        value: { text: f.text },
        confidence: f.confidence,
        evidenceState: f.evidenceState,
        sourcePage: f.sourcePage,
        sourceText: f.sourceText,
      })),
    });

    if (analysis.deadlines.length > 0) {
      await tx.deadline.createMany({
        data: analysis.deadlines.map((d) => ({
          caseId,
          date: toDate(d.date),
          description: d.description,
          confidence: d.confidence,
          sourcePage: d.sourcePage,
        })),
      });
    }

    if (analysis.tasks.length > 0) {
      await tx.task.createMany({
        data: analysis.tasks.map((t) => ({
          caseId,
          title: t.title,
          description: t.description ?? "",
          required: t.required,
          dueDate: toDate(t.dueDate),
          sourcePage: t.sourcePage,
        })),
      });
    }

    if (analysis.requiredMaterials.length > 0) {
      await tx.requiredMaterial.createMany({
        data: analysis.requiredMaterials.map((m) => ({
          caseId,
          name: m.name,
          description: m.description ?? null,
          required: m.required,
          sourcePage: m.sourcePage,
        })),
      });
    }

    if (analysis.submissionMethods.length > 0) {
      await tx.submissionMethod.createMany({
        data: analysis.submissionMethods.map((s) => ({
          caseId,
          method: s.method,
          destination: s.destination ?? null,
          instructions: s.instructions ?? null,
          sourcePage: s.sourcePage,
        })),
      });
    }

    await tx.document.update({
      where: { id: documentId },
      data: { processingStatus: "ready" },
    });
  });

  return { actionStatus, urgency: analysis.action.urgency };
}
