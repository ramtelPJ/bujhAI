import { put, del, get } from "@vercel/blob";

/**
 * Uploaded documents must use private storage (architecture-context.md invariant #2)
 * and are never exposed as a permanent public URL. Blob access always requires
 * `access: "private"` — callers never get a shareable link back, only a `blobPath`
 * to store on the `documents` row.
 */
export async function uploadPrivateFile(pathname: string, file: File | Blob, contentType?: string) {
  const blob = await put(pathname, file, {
    access: "private",
    contentType,
    addRandomSuffix: true,
  });
  return blob.pathname;
}

export async function readPrivateFile(blobPath: string) {
  return get(blobPath, { access: "private" });
}

export async function deletePrivateFile(blobPath: string) {
  await del(blobPath);
}
