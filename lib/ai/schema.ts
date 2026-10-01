import { z } from "zod";
import { ActionStatus, Urgency, EvidenceState } from "@/lib/generated/prisma/enums";

const actionStatusValues = Object.values(ActionStatus) as [ActionStatus, ...ActionStatus[]];
const urgencyValues = Object.values(Urgency) as [Urgency, ...Urgency[]];
const evidenceStateValues = Object.values(EvidenceState) as [EvidenceState, ...EvidenceState[]];

/**
 * A fact the model must mark explicit/inferred/unknown/not_found rather than
 * state as if confirmed (build-plan.md Feature 10, architecture-context.md
 * Evidence States). Persisted as a row in `extractions`.
 *
 * Every "optional" field below uses `.nullable()`, not `.optional()`. OpenAI's
 * Structured Outputs (strict JSON schema) mode requires every object property
 * to appear in `required` — `.optional()` gets converted to "omit from
 * required" by the AI SDK's zod-to-json-schema step and the Gateway rejects
 * the schema outright ("'required' is required to... include every key in
 * properties"). `.nullable()` keeps the key required while still letting the
 * model say "not present" via `null`. Every consumer already reads these
 * with `?? undefined`/`??`, which treats `null` and `undefined` identically,
 * so nothing downstream needed to change.
 */
const evidenceField = z.object({
  text: z.string(),
  evidenceState: z.enum(evidenceStateValues),
  confidence: z.number().min(0).max(1),
  sourcePage: z.number().int().positive().nullable(),
  sourceText: z.string().nullable(),
});

/** A checklist item as the model proposes it — shared by document analysis (Feature 10) and AI Help's suggested checklist items (Feature 13), both of which become a `Task` row via the same `toDate` conversion. */
const taskItemField = z.object({
  title: z.string().min(1),
  description: z.string().nullable(),
  required: z.boolean(),
  /** ISO date string. */
  dueDate: z.string().nullable(),
  sourcePage: z.number().int().positive().nullable(),
});

export const DocumentAnalysisSchema = z.object({
  document: z.object({
    type: z.string().min(1),
    issuer: z.string().nullable(),
    recipient: z.string().nullable(),
    /** ISO date string. */
    issueDate: z.string().nullable(),
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
      /** ISO date string. Null when a date genuinely can't be determined. */
      date: z.string().nullable(),
      description: z.string().min(1),
      confidence: z.number().min(0).max(1),
      sourcePage: z.number().int().positive().nullable(),
    }),
  ),
  tasks: z.array(taskItemField),
  requiredMaterials: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().nullable(),
      required: z.boolean(),
      sourcePage: z.number().int().positive().nullable(),
    }),
  ),
  submissionMethods: z.array(
    z.object({
      method: z.string().min(1),
      destination: z.string().nullable(),
      instructions: z.string().nullable(),
      sourcePage: z.number().int().positive().nullable(),
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
  // Plain required array, not `.default([])` — a Zod default also makes the
  // key "optional" for the JSON-schema `required` list (same strict-mode
  // issue as the `.nullable()` fields above), so the model must always
  // emit it; an empty array is how it says "nothing to suggest."
  suggestedChecklistItems: z.array(taskItemField),
});

export type AiHelpResponse = z.infer<typeof AiHelpResponseSchema>;
export type SuggestedTaskItem = z.infer<typeof taskItemField>;

/** Draft generation's validated output (Feature 14) — the grounded, editable draft text. */
export const DraftResponseSchema = z.object({
  content: z.string().min(1),
});

export type DraftResponse = z.infer<typeof DraftResponseSchema>;
