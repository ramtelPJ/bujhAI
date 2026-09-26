/**
 * Self-check for Feature 10's persistence logic: a validated DocumentAnalysis
 * (no real AI call — the LLM path is exercised manually, not here) lands as
 * the expected case + child rows, a past deadline forces actionStatus to
 * "deadline_passed" regardless of what the model reported, and the document
 * flips to "ready". Run with: npm run db:verify-analysis
 *
 * Must run via dotenv-cli, not an in-file dotenv.config() call — see
 * scripts/verify-rls.ts for why.
 */
import { prisma } from "../lib/db/client";
import { withUser } from "../lib/db/withUser";
import { DocumentAnalysisSchema, type DocumentAnalysis } from "../lib/ai/schema";
import { persistAnalysis } from "../lib/documents/persist-analysis";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

const fakeAnalysis: DocumentAnalysis = {
  document: { type: "Test Notice", issuer: "Test Issuer", recipient: "Test Recipient", issueDate: "2026-01-01" },
  explanation: {
    whatThisIs: { text: "This is a test notice.", evidenceState: "explicit", confidence: 0.9, sourcePage: 1 },
    whyReceived: { text: "Because this is a test.", evidenceState: "inferred", confidence: 0.6 },
  },
  // Deliberately "required" — the past deadline below must override this to "deadline_passed".
  action: { status: "required", urgency: "high", summary: "Test summary." },
  deadlines: [{ date: "2020-01-01", description: "Test deadline", confidence: 0.8, sourcePage: 2 }],
  tasks: [{ title: "Do the test task", required: true, sourcePage: 3 }],
  requiredMaterials: [{ name: "Test material", required: true }],
  submissionMethods: [{ method: "Mail", destination: "123 Test St" }],
  consequences: { text: "", evidenceState: "not_found", confidence: 0.5 },
  uncertainties: ["Something is genuinely unclear."],
  confidence: 0.75,
};

async function main() {
  DocumentAnalysisSchema.parse(fakeAnalysis); // catches schema/fixture drift

  const user = await prisma.user.create({ data: { clerkId: `test_analysis_${Date.now()}` } });

  try {
    const doc = await withUser(user.id, (tx) =>
      tx.document.create({
        data: {
          userId: user.id,
          fileName: "test.pdf",
          mimeType: "application/pdf",
          blobPath: "test/test.pdf",
          fileSize: 1,
          processingStatus: "processing",
        },
      }),
    );

    const caseId = crypto.randomUUID();
    const result = await persistAnalysis({ documentId: doc.id, userId: user.id, caseId, analysis: fakeAnalysis });
    assert(result.actionStatus === "deadline_passed", `expected deadline_passed, got: ${result.actionStatus}`);

    const persistedCase = await withUser(user.id, (tx) =>
      tx.case.findUnique({
        where: { id: caseId },
        include: { extractions: true, deadlines: true, tasks: true, requiredMaterials: true, submissionMethods: true },
      }),
    );
    assert(persistedCase !== null, "case should have been created");
    assert(persistedCase.actionStatus === "deadline_passed", "case.actionStatus should be overridden by the past deadline");
    assert(persistedCase.uncertainties.length === 1, "uncertainties should be persisted onto the case");
    assert(persistedCase.extractions.length === 3, `expected 3 extraction rows, got ${persistedCase.extractions.length}`);
    assert(
      persistedCase.extractions.some((e) => e.field === "consequences" && e.evidenceState === "not_found"),
      "consequences extraction should keep its not_found evidenceState",
    );
    assert(persistedCase.deadlines.length === 1, "deadline row should be persisted");
    assert(persistedCase.tasks.length === 1, "task row should be persisted");
    assert(persistedCase.requiredMaterials.length === 1, "required material row should be persisted");
    assert(persistedCase.submissionMethods.length === 1, "submission method row should be persisted");

    const persistedDoc = await withUser(user.id, (tx) => tx.document.findUnique({ where: { id: doc.id } }));
    assert(persistedDoc?.processingStatus === "ready", "document should flip to ready");

    console.log("PASS: analysis persistence behaves correctly.");
  } finally {
    await prisma.user.deleteMany({ where: { id: user.id } });
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
