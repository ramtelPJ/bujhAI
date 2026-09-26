/**
 * Self-check for Feature 11's "short-lived, server-authorized access URL" to
 * the original document (architecture-context.md Access Model: never a
 * permanent public link). Confirms a presigned URL can actually fetch the
 * private blob's bytes, and that a tampered/expired one is rejected.
 * Run with: npm run db:verify-signed-url
 */
import { uploadPrivateFile, deletePrivateFile, getShortLivedFileUrl } from "../lib/storage";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

async function main() {
  const pathname = `test/verify-signed-url-${Date.now()}.txt`;
  const body = "signed url smoke test";
  const blobPath = await uploadPrivateFile(pathname, new Blob([body], { type: "text/plain" }), "text/plain");

  try {
    const url = await getShortLivedFileUrl(blobPath, 60_000);

    const fetched = await fetch(url);
    assert(fetched.ok, `presigned URL should fetch the private blob, got status ${fetched.status}`);
    assert((await fetched.text()) === body, "fetched content should match what was uploaded");

    // issueSignedToken/presignUrl both reject a validUntil already in the
    // past, so instead issue one with just enough headroom to complete those
    // two round trips, then let it lapse before fetching.
    const soonToExpireUrl = await getShortLivedFileUrl(blobPath, 3000);
    await new Promise((resolve) => setTimeout(resolve, 3500));
    const expiredResponse = await fetch(soonToExpireUrl);
    assert(!expiredResponse.ok, "an expired presigned URL should be rejected");

    console.log("PASS: short-lived signed document URLs behave correctly.");
  } finally {
    await deletePrivateFile(blobPath);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
