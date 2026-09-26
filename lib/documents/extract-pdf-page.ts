import { PDFDocument } from "pdf-lib";

/**
 * Extracts a single page (0-indexed) into a standalone one-page PDF, so a
 * page needing OCR can be sent to the vision model without exposing the
 * rest of the document.
 */
export async function extractPdfPage(bytes: Uint8Array, pageIndex: number): Promise<Uint8Array> {
  const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const target = await PDFDocument.create();
  const [page] = await target.copyPages(source, [pageIndex]);
  target.addPage(page);
  return target.save();
}
