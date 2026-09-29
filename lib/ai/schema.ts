import { z } from "zod";
import { ActionStatus, Urgency, EvidenceState } from "@/lib/generated/prisma/enums";

const actionStatusValues = Object.values(ActionStatus) as [ActionStatus, ...ActionStatus[]];
const urgencyValues = Object.values(Urgency) as [Urgency, ...Urgency[]];
const evidenceStateValues = Object.values(EvidenceState) as [EvidenceState, ...EvidenceState[]];

/**
 * A fact the model must mark explicit/inferred/unknown/not_found rather than
 * state as if confirmed (build-plan.md Feature 10, architecture-context.md
 * Evidence States). Persisted as a row in `extractions`.
 */
const evidenceField = z.object({
  text: z.string(),
  evidenceState: z.enum(evidenceStateValues),
  confidence: z.number().min(0).max(1),
  sourcePage: z.number().int().positive().optional(),
  sourceText: z.string().optional(),
});

/** A checklist item as the model proposes it — shared by document analysis (Feature 10) and AI Help's suggested checklist items (Feature 13), both of which become a `Task` row via the same `toDate` conversion. */
const taskItemField = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  required: z.boolean(),
  /** ISO date string. */
  dueDate: z.string().optional(),
  sourcePage: z.number().int().positive().optional(),
});

export const DocumentAnalysisSchema = z.object({
  document: z.object({
    type: z.string().min(1),
    issuer: z.string().optional(),
    recipient: z.string().optional(),
    /** ISO date string. */
    issueDate: z.string().optional(),
  }),
  /**
   * "What this is" / "Why you received it" — not in project-overview.md's
   * original AI Analysis Contract, added here to back the two dedicated
   * sections Feature 08 already built (components/cases/fact-section.tsx).
   * See project-overview.md's contract for the note on this addition.
   */
  explanation: z.object({
    whatThisIs: evidenceField,
    whyReceived: evidenceField,
  }),
  action: z.object({
    status: z.enum(actionStatusValues),
    urgency: z.enum(urgencyValues),
    summary: z.string().min(1),
  }),
  deadlines: z.array(
    z.object({
      /** ISO date string. Omitted when a date genuinely can't be determined. */
      date: z.string().optional(),
      description: z.string().min(1),
      confidence: z.number().min(0).max(1),
      sourcePage: z.number().int().positive().optional(),
    }),
  ),
  tasks: z.array(taskItemField),
  requiredMaterials: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      required: z.boolean(),
      sourcePage: z.number().int().positive().optional(),
    }),
  ),
  submissionMethods: z.array(
    z.object({
      method: z.string().min(1),
      destination: z.string().optional(),
      instructions: z.string().optional(),
      sourcePage: z.number().int().positive().optional(),
    }),
  ),
  /** Always present — evidenceState is "not_found" when no consequence is stated. */
  consequences: evidenceField,
  uncertainties: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export type DocumentAnalysis = z.infer<typeof DocumentAnalysisSchema>;

/**
 * AI Help's response shape (Feature 13) — a grounded answer plus zero or more
 * checklist items it's suggesting. Suggestions are never auto-persisted; a
 * task row is only created when the user clicks Add (see
 * app/api/cases/[id]/tasks/route.ts).
 */
export const AiHelpResponseSchema = z.object({
  answer: z.string().min(1),
  suggestedChecklistItems: z.array(taskItemField).default([]),
});

export type AiHelpResponse = z.infer<typeof AiHelpResponseSchema>;
export type SuggestedTaskItem = z.infer<typeof taskItemField>;
