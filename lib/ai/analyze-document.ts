import { generateObject } from "ai";
import { DocumentAnalysisSchema, type DocumentAnalysis } from "./schema";
import type { ParsedPage } from "@/lib/documents/parse";

/**
 * openai/gpt-6 via the Vercel AI Gateway — full-tier reasoning model, unlike
 * the "-luna" tier lib/ocr/index.ts uses for cheap page transcription.
 * Structured legal/financial/administrative extraction needs the stronger
 * model; latency doesn't matter since this runs in a background job.
 */
const ANALYSIS_MODEL = "openai/gpt-6";

/** Retried once on invalid output before the caller marks analysis failed. */
const MAX_ATTEMPTS = 2;

const SYSTEM_PROMPT = `You turn a confusing document into a grounded, actionable plan for the \
person who received it. The document's normalized page text is provided as the user message, \
with page numbers marked.

Rules:
- Ground every important claim in the document text. Do not rely on outside knowledge about the \
issuer, program, or process beyond what the document itself says.
- Never invent a deadline, requirement, contact method, or consequence that the document does \
not support.
- For document.type/issuer/recipient/issueDate, explanation.whatThisIs, explanation.whyReceived, \
and consequences, mark evidenceState honestly: "explicit" (directly stated), "inferred" (a \
reasonable interpretation from context), "unknown" (cannot be determined from this document), or \
"not_found" (you looked and it isn't there). When evidenceState is "not_found", still return the \
field with empty or minimal text — never fabricate content to fill it.
- Cite sourcePage (and sourceText when it helps) for explanation.whatThisIs, \
explanation.whyReceived, consequences, and every deadline/task/requiredMaterial/submissionMethod, \
whenever you can identify the supporting page.
- An ambiguous or low-confidence deadline must still be reported, with a low confidence score — \
never present it as certain.
- List anything genuinely ambiguous or unclear about the document in uncertainties.
- confidence is your overall confidence in this whole analysis, from 0 to 1.
- Do not give legal advice, medical diagnosis, or financial advice — only report what the \
document says and what it asks the recipient to do.`;

function buildDocumentText(pages: ParsedPage[]): string {
  return pages.map((page) => `--- Page ${page.pageNumber} ---\n${page.text}`).join("\n\n");
}

/**
 * Calls the model for structured document analysis, validating against
 * DocumentAnalysisSchema. Retries once on invalid/incomplete output before
 * giving up — the caller (trigger/analysis) marks the document failed rather
 * than persisting a partial or unvalidated result.
 */
export async function analyzeDocument(pages: ParsedPage[]): Promise<DocumentAnalysis> {
  const prompt = buildDocumentText(pages);
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { object } = await generateObject({
        model: ANALYSIS_MODEL,
        schema: DocumentAnalysisSchema,
        system: SYSTEM_PROMPT,
        prompt,
      });
      return object;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("AI analysis failed");
}
