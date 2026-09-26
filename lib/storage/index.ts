import { put, del, get, issueSignedToken, presignUrl } from "@vercel/blob";

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

/** Downloads a private blob's bytes (not just its metadata). */
export async function readPrivateFile(
  blobPath: string,
): Promise<{ data: Uint8Array; contentType: string }> {
  const result = await get(blobPath, { access: "private" });
  if (!result || !result.stream) {
    throw new Error(`Blob not found: ${blobPath}`);
  }
  const data = new Uint8Array(await new Response(result.stream).arrayBuffer());
  return { data, contentType: result.blob.contentType };
}

export async function deletePrivateFile(blobPath: string) {
  await del(blobPath);
}

/**
 * A time-limited, single-purpose URL for viewing a private original document
 * (architecture-context.md Access Model: "never a permanent public URL").
 * The browser fetches this directly; it stops working after `ttlMs`.
 */
export async function getShortLivedFileUrl(blobPath: string, ttlMs = 5 * 60 * 1000): Promise<string> {
  const validUntil = Date.now() + ttlMs;
  const signedToken = await issueSignedToken({ pathname: blobPath, operations: ["get"], validUntil });
  const { presignedUrl } = await presignUrl(signedToken, {
    operation: "get",
    pathname: blobPath,
    access: "private",
    validUntil,
  });
  return presignedUrl;
}
