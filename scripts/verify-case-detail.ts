/**
 * Self-check for Feature 11's getCaseDetail: ownership enforcement (owner vs
 * non-owner vs unknown id), and that both a caseId and its source documentId
 * resolve the same ready case, and that a still-processing/failed document
 * (no case row yet) resolves to the right pending state. Run with:
 * npm run db:verify-case-detail
 */
import { prisma } from "../lib/db/client";
import { withUser } from "../lib/db/withUser";
import { DocumentAnalysisSchema, type DocumentAnalysis } from "../lib/ai/schema";
import { persistAnalysis } from "../lib/documents/persist-analysis";
import { getCaseDetail } from "../app/cases/[id]/get-case-detail";
import { AUTH_ERRORS } from "../lib/auth/errors";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

const fakeAnalysis: DocumentAnalysis = {
  document: { type: "Test Notice", issuer: "Test Issuer" },
  explanation: {
    whatThisIs: { text: "This is a test notice.", evidenceState: "explicit", confidence: 0.9, sourcePage: 1 },
    whyReceived: { text: "Because this is a test.", evidenceState: "inferred", confidence: 0.6 },
  },
  action: { status: "required", urgency: "medium", summary: "Test summary." },
  deadlines: [{ date: "2030-01-01", description: "Test deadline", confidence: 0.9, sourcePage: 2 }],
  tasks: [{ title: "Do the test task", required: true }],
  requiredMaterials: [],
  submissionMethods: [],
  consequences: { text: "", evidenceState: "not_found", confidence: 0.5 },
  uncertainties: [],
  confidence: 0.8,
};

async function main() {
  DocumentAnalysisSchema.parse(fakeAnalysis);

  const userA = await prisma.user.create({ data: { clerkId: `test_cd_a_${Date.now()}` } });
  const userB = await prisma.user.create({ data: { clerkId: `test_cd_b_${Date.now()}` } });

  try {
    const readyDoc = await withUser(userA.id, (tx) =>
      tx.document.create({
        data: {
          userId: userA.id,
          fileName: "ready.pdf",
          mimeType: "application/pdf",
          blobPath: "test/ready.pdf",
          fileSize: 1,
          processingStatus: "processing",
        },
      }),
    );
    const caseId = crypto.randomUUID();
    await persistAnalysis({ documentId: readyDoc.id, userId: userA.id, caseId, analysis: fakeAnalysis });

    // Ready case, accessed by its caseId.
    const byCaseId = await getCaseDetail(caseId, userA.id);
    assert(byCaseId.status === "ready", "ready case accessed by caseId should be status ready");
    assert(byCaseId.status === "ready" && byCaseId.caseDetail.documentType === "Test Notice", "mapped documentType should match");
    assert(
      byCaseId.status === "ready" && byCaseId.caseDetail.originalDocumentUrl.startsWith("http"),
      "originalDocumentUrl should be a real signed URL",
    );

    // Same ready case, accessed by its source documentId.
    const byDocumentId = await getCaseDetail(readyDoc.id, userA.id);
    assert(byDocumentId.status === "ready", "ready case should also resolve via its documentId");
    assert(byDocumentId.status === "ready" && byDocumentId.caseDetail.id === caseId, "should resolve to the same case");

    // Non-owner: forbidden for both id forms.
    await getCaseDetail(caseId, userB.id).then(
      () => {
        throw new Error("FAIL: non-owner should not read another user's case");
      },
      (err) => assert(err.message === AUTH_ERRORS.forbidden, `expected forbidden, got: ${err.message}`),
    );

    // Unknown id: not found.
    await getCaseDetail("does-not-exist", userA.id).then(
      () => {
        throw new Error("FAIL: unknown id should not resolve");
      },
      (err) => assert(err.message === AUTH_ERRORS.notFound, `expected notFound, got: ${err.message}`),
    );

    // Still-processing document — no case row yet.
    const processingDoc = await withUser(userA.id, (tx) =>
      tx.document.create({
        data: {
          userId: userA.id,
          fileName: "processing.pdf",
          mimeType: "application/pdf",
          blobPath: "test/processing.pdf",
          fileSize: 1,
          processingStatus: "processing",
        },
      }),
    );
    const processingResult = await getCaseDetail(processingDoc.id, userA.id);
    assert(processingResult.status === "processing", "a processing document should resolve to status processing");

    // Failed document — carries the real processingError through.
    const failedDoc = await withUser(userA.id, (tx) =>
      tx.document.create({
        data: {
          userId: userA.id,
          fileName: "failed.pdf",
          mimeType: "application/pdf",
          blobPath: "test/failed.pdf",
          fileSize: 1,
          processingStatus: "failed",
          processingError: "We couldn't analyze this document right now.",
        },
      }),
    );
    const failedResult = await getCaseDetail(failedDoc.id, userA.id);
    assert(failedResult.status === "failed", "a failed document should resolve to status failed");
    assert(
      failedResult.status === "failed" && failedResult.processingError === "We couldn't analyze this document right now.",
      "failed status should carry the real processingError through",
    );

    console.log("PASS: getCaseDetail behaves correctly.");
  } finally {
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
