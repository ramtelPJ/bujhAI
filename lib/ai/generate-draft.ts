import { generateObject } from "ai";
import { DraftResponseSchema, type DraftResponse } from "./schema";
import type { DraftType } from "@/lib/generated/prisma/enums";

/** Same full-tier model as the rest of lib/ai — drafting needs the same grounding quality. */
/** See lib/ai/analyze-document.ts's ANALYSIS_MODEL comment — same Gateway tier restriction applies. */
const DRAFT_MODEL = "openai/gpt-4.1";

/** Retried once on invalid output, same as answerCaseQuestion/analyzeDocument. */
const MAX_ATTEMPTS = 2;

const DRAFT_TYPE_LABEL: Record<DraftType, string> = {
  response: "a written response",
  email: "an email",
  letter: "a formal letter",
};

const SYSTEM_PROMPT = `You are bujhAI's drafting assistant, writing {{TYPE_LABEL}} on behalf of the \
person who received the document described below, so they can review, edit, and send it themselves.

Rules:
- Ground the draft in the case facts and document text provided below — never invent facts, \
deadlines, requirements, or contacts the document doesn't support.
- Follow the person's instructions if given; otherwise write a draft that responds to what the \
document is asking for.
- Write only the draft content itself — no commentary, no meta-explanation, no placeholders \
beyond what's natural for the format (e.g. "[Your Name]").
- This draft is never sent automatically. The person always reviews, edits, and sends it \
themselves — never suggest otherwise.

--- CASE FACTS ---
{{FACTS}}

--- DOCUMENT TEXT ---
{{DOCUMENT}}`;

/** Generates one editable draft, grounded in the case's facts and original document text. */
export async function generateDraft(params: {
  factsText: string;
  documentText: string;
  draftType: DraftType;
  instructions?: string;
}): Promise<DraftResponse> {
  const system = SYSTEM_PROMPT.replace("{{TYPE_LABEL}}", DRAFT_TYPE_LABEL[params.draftType])
    .replace("{{FACTS}}", params.factsText)
    .replace("{{DOCUMENT}}", params.documentText);

  const prompt = params.instructions
    ? `Additional instructions: ${params.instructions}`
    : "No additional instructions — use your judgment based on the document.";

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { object } = await generateObject({
        model: DRAFT_MODEL,
        schema: DraftResponseSchema,
        system,
        prompt,
      });
      return object;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Draft generation failed");
}
