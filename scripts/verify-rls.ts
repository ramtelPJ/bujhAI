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
import {
  assertDocumentOwner,
  assertCaseOwner,
  assertTaskOwner,
  assertNoteOwner,
  assertDraftOwner,
} from "../lib/auth/ownership";
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

    // Feature 12: tasks (no direct userId, owned via parent case) and case notes.
    const task = await withUser(userA.id, (tx) =>
      tx.task.create({ data: { caseId: caseRow.id, title: "test", description: "test", required: true } }),
    );
    const note = await withUser(userA.id, (tx) =>
      tx.caseNote.create({ data: { caseId: caseRow.id, userId: userA.id, content: "test" } }),
    );

    await assertTaskOwner(task.id, userA.id);
    await assertNoteOwner(note.id, userA.id);

    await assertTaskOwner(task.id, userB.id).then(
      () => {
        throw new Error("FAIL: assertTaskOwner should have rejected a non-owner");
      },
      (err) => assert(err.message === AUTH_ERRORS.forbidden, `expected forbidden, got: ${err.message}`),
    );
    await assertNoteOwner(note.id, userB.id).then(
      () => {
        throw new Error("FAIL: assertNoteOwner should have rejected a non-owner");
      },
      (err) => assert(err.message === AUTH_ERRORS.forbidden, `expected forbidden, got: ${err.message}`),
    );
    await assertTaskOwner("does-not-exist", userA.id).then(
      () => {
        throw new Error("FAIL: assertTaskOwner should have rejected an unknown id");
      },
      (err) => assert(err.message === AUTH_ERRORS.notFound, `expected notFound, got: ${err.message}`),
    );

    // Feature 14: drafts (direct userId, same shape as documents/cases).
    const draft = await withUser(userA.id, (tx) =>
      tx.draft.create({ data: { caseId: caseRow.id, userId: userA.id, type: "email", content: "test" } }),
    );

    await assertDraftOwner(draft.id, userA.id);

    await assertDraftOwner(draft.id, userB.id).then(
      () => {
        throw new Error("FAIL: assertDraftOwner should have rejected a non-owner");
      },
      (err) => assert(err.message === AUTH_ERRORS.forbidden, `expected forbidden, got: ${err.message}`),
    );
    await assertDraftOwner("does-not-exist", userA.id).then(
      () => {
        throw new Error("FAIL: assertDraftOwner should have rejected an unknown id");
      },
      (err) => assert(err.message === AUTH_ERRORS.notFound, `expected notFound, got: ${err.message}`),
    );

    // Feature 20 hardening: the remaining tables never get a direct ownership-assert
    // function (nothing addresses them by their own id in any route — they're only ever
    // read as children of a case/conversation the caller already owns), so RLS itself,
    // not an assert*Owner helper, is what's under test here. Two-user coverage was
    // previously only implied transitively; assert it directly per table.
    const extraction = await withUser(userA.id, (tx) =>
      tx.extraction.create({
        data: { caseId: caseRow.id, field: "whatThisIs", value: { text: "test" }, confidence: 0.9, evidenceState: "explicit" },
      }),
    );
    const deadline = await withUser(userA.id, (tx) =>
      tx.deadline.create({ data: { caseId: caseRow.id, description: "test", confidence: 0.9 } }),
    );
    const material = await withUser(userA.id, (tx) =>
      tx.requiredMaterial.create({ data: { caseId: caseRow.id, name: "test", required: true } }),
    );
    const submissionMethod = await withUser(userA.id, (tx) =>
      tx.submissionMethod.create({ data: { caseId: caseRow.id, method: "test" } }),
    );
    const conversation = await withUser(userA.id, (tx) =>
      tx.conversation.create({ data: { caseId: caseRow.id, userId: userA.id } }),
    );
    const message = await withUser(userA.id, (tx) =>
      tx.message.create({ data: { conversationId: conversation.id, role: "user", content: "test" } }),
    );

    assert(
      (await withUser(userA.id, (tx) => tx.extraction.findUnique({ where: { id: extraction.id } }))) !== null,
      "owner should see their own extraction through RLS",
    );
    assert(
      (await withUser(userB.id, (tx) => tx.extraction.findUnique({ where: { id: extraction.id } }))) === null,
      "RLS should hide another user's extraction",
    );
    assert(
      (await withUser(userA.id, (tx) => tx.deadline.findUnique({ where: { id: deadline.id } }))) !== null,
      "owner should see their own deadline through RLS",
    );
    assert(
      (await withUser(userB.id, (tx) => tx.deadline.findUnique({ where: { id: deadline.id } }))) === null,
      "RLS should hide another user's deadline",
    );
    assert(
      (await withUser(userA.id, (tx) => tx.requiredMaterial.findUnique({ where: { id: material.id } }))) !== null,
      "owner should see their own required material through RLS",
    );
    assert(
      (await withUser(userB.id, (tx) => tx.requiredMaterial.findUnique({ where: { id: material.id } }))) === null,
      "RLS should hide another user's required material",
    );
    assert(
      (await withUser(userA.id, (tx) =>
        tx.submissionMethod.findUnique({ where: { id: submissionMethod.id } }),
      )) !== null,
      "owner should see their own submission method through RLS",
    );
    assert(
      (await withUser(userB.id, (tx) =>
        tx.submissionMethod.findUnique({ where: { id: submissionMethod.id } }),
      )) === null,
      "RLS should hide another user's submission method",
    );
    assert(
      (await withUser(userA.id, (tx) => tx.conversation.findUnique({ where: { id: conversation.id } }))) !== null,
      "owner should see their own conversation through RLS",
    );
    assert(
      (await withUser(userB.id, (tx) => tx.conversation.findUnique({ where: { id: conversation.id } }))) === null,
      "RLS should hide another user's conversation",
    );
    assert(
      (await withUser(userA.id, (tx) => tx.message.findUnique({ where: { id: message.id } }))) !== null,
      "owner should see their own message through RLS",
    );
    assert(
      (await withUser(userB.id, (tx) => tx.message.findUnique({ where: { id: message.id } }))) === null,
      "RLS should hide another user's message",
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
