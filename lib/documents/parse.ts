import { getDocumentProxy, extractText } from "unpdf";
import { extractPdfPage } from "@/lib/documents/extract-pdf-page";
import { ocrPage } from "@/lib/ocr";

export interface ParsedPage {
  /** 1-indexed, for source-page references shown in the UI. */
  pageNumber: number;
  text: string;
  source: "embedded" | "ocr";
}

export interface ParsedDocument {
  pageCount: number;
  pages: ParsedPage[];
}

/**
 * Turns an uploaded file into normalized, page-numbered text. PDF pages
 * with usable embedded text are read directly; pages with none (scanned or
 * image-only) and standalone image uploads go through OCR.
 */
export async function parseDocument(file: {
  data: Uint8Array;
  mimeType: string;
}): Promise<ParsedDocument> {
  if (file.mimeType !== "application/pdf") {
    const text = await ocrPage(file.data, file.mimeType);
    return { pageCount: 1, pages: [{ pageNumber: 1, text, source: "ocr" }] };
  }

  const pdf = await getDocumentProxy(file.data);
  const { totalPages, text: pageTexts } = await extractText(pdf);
  const texts = Array.isArray(pageTexts) ? pageTexts : [pageTexts];

  const pages: ParsedPage[] = [];
  for (let i = 0; i < totalPages; i++) {
    const embedded = (texts[i] ?? "").trim();
    if (embedded.length > 0) {
      pages.push({ pageNumber: i + 1, text: embedded, source: "embedded" });
      continue;
    }
    const pageBytes = await extractPdfPage(file.data, i);
    const ocrText = await ocrPage(pageBytes, "application/pdf");
    pages.push({ pageNumber: i + 1, text: ocrText, source: "ocr" });
  }

  return { pageCount: totalPages, pages };
}
