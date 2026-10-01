import { generateText } from "ai";

/**
 * openai/gpt-4.1-mini via the Vercel AI Gateway: vision-capable and cheap,
 * a good fit for per-page OCR. The "-luna"/"-sol" tiers return "Free tier
 * users do not have access to this model" on this account (a Vercel AI
 * Gateway credit balance restriction, confirmed against the live Gateway,
 * not fixable in code) — see lib/ai/analyze-document.ts's ANALYSIS_MODEL
 * comment for the same issue on the analysis/chat/draft models.
 */
const OCR_MODEL = "openai/gpt-4.1-mini";

const OCR_PROMPT =
  "Transcribe every word of readable text from this document page, in reading order. " +
  "Output plain text only — no commentary, no markdown, no summary. If the page has no " +
  "readable text, output nothing.";

/**
 * Vision-model OCR for a page with no usable embedded text — a scanned PDF
 * page (passed as a standalone one-page PDF) or a photographed document
 * image. Used by lib/documents/parse.ts.
 */
export async function ocrPage(data: Uint8Array, mediaType: string): Promise<string> {
  const { text } = await generateText({
    model: OCR_MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: OCR_PROMPT },
          { type: "file", mediaType, data },
        ],
      },
    ],
  });
  return text.trim();
}
