import { PDFDocument } from "pdf-lib";

/**
 * Cheap structural read for the `document_uploaded` analytics property —
 * not the real parsing pipeline (Feature 09 does OCR/text extraction in
 * Trigger.dev). Images are always single-page. A PDF that fails to parse
 * here is treated as invalid by the caller (also catches corrupted files).
 */
export async function getPageCount(file: File): Promise<number> {
  if (file.type !== "application/pdf") return 1;
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return pdf.getPageCount();
}
