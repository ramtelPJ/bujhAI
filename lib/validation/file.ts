/**
 * Shared between the upload UI (client-side feedback) and the server-side
 * validation in Feature 07 — single source of truth for what's accepted.
 */
export const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export const ACCEPTED_FILE_EXTENSIONS = ".pdf,.jpg,.jpeg,.png";
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function isAcceptedFile(file: File): boolean {
  return (
    (ACCEPTED_FILE_TYPES as readonly string[]).includes(file.type) &&
    file.size > 0 &&
    file.size <= MAX_FILE_SIZE_BYTES
  );
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
