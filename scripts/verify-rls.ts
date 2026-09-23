/**
 * Self-check for Feature 05's ownership layer: RLS actually blocks cross-user
 * reads, and assertDocumentOwner/assertCaseOwner return the right distinct
 * errors for "not found" vs "not yours". Run with: npm run db:verify-rls
 *
 * Must run via dotenv-cli (see the npm script), not an in-file dotenv.config()
 * call — ESM import hoisting evaluates `lib/db/client.ts` (and reads its env
 * vars) before any same-file dotenv call would take effect.
 */
import { prisma } from "../lib/db/client";
import { withUser } from "../lib/db/withUser";
import { assertDocumentOwner, assertCaseOwner } from "../lib/auth/ownership";
import { AUTH_ERRORS } from "../lib/auth/errors";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

async function main() {
  const userA = await prisma.user.create({ data: { clerkId: `test_a_${Date.now()}` } });
  const userB = await prisma.user.create({ data: { clerkId: `test_b_${Date.now()}` } });

  try {
    const doc = await withUser(userA.id, (tx) =>
      tx.document.create({
        data: {
          userId: userA.id,
          fileName: "test.pdf",
          mimeType: "application/pdf",
          blobPath: "test/test.pdf",
          fileSize: 1,
        },
      }),
    );

    const caseRow = await withUser(userA.id, (tx) =>
      tx.case.create({
        data: {
          userId: userA.id,
          documentId: doc.id,
          documentType: "test",
          summary: "test",
        },
      }),
    );

    // RLS: owner can read, other user cannot.
    const seenByOwner = await withUser(userA.id, (tx) => tx.document.findUnique({ where: { id: doc.id } }));
    assert(seenByOwner !== null, "owner should see their own document through RLS");

    const seenByOther = await withUser(userB.id, (tx) => tx.document.findUnique({ where: { id: doc.id } }));
    assert(seenByOther === null, "RLS should hide another user's document");

    const caseSeenByOther = await withUser(userB.id, (tx) => tx.case.findUnique({ where: { id: caseRow.id } }));
    assert(caseSeenByOther === null, "RLS should hide another user's case");

    // Ownership helpers: owner passes, non-owner is forbidden, unknown id is not-found.
    await assertDocumentOwner(doc.id, userA.id);
    await assertCaseOwner(caseRow.id, userA.id);

    await assertDocumentOwner(doc.id, userB.id).then(
      () => {
        throw new Error("FAIL: assertDocumentOwner should have rejected a non-owner");
      },
      (err) => assert(err.message === AUTH_ERRORS.forbidden, `expected forbidden, got: ${err.message}`),
    );

    await assertDocumentOwner("does-not-exist", userA.id).then(
      () => {
        throw new Error("FAIL: assertDocumentOwner should have rejected an unknown id");
      },
      (err) => assert(err.message === AUTH_ERRORS.notFound, `expected notFound, got: ${err.message}`),
    );

    console.log("PASS: RLS and ownership helpers behave correctly.");
  } finally {
    // Cleanup — users table has no RLS, cascades take the rest.
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
