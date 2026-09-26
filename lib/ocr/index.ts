import { generateText } from "ai";

/**
 * openai/gpt-6-luna via the Vercel AI Gateway: vision-capable, priced for
 * high-volume/cost-sensitive extraction (see openai/gpt-6-luna's gateway
 * listing) — a good fit for per-page OCR. Not the "-fast" tier since this
 * runs in a background job where latency doesn't matter.
 */
const OCR_MODEL = "openai/gpt-6-luna";

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
