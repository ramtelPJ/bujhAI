import { withUser } from "@/lib/db/withUser";
import { readPrivateFile } from "@/lib/storage";
import { AUTH_ERRORS } from "@/lib/auth/errors";
import type { ParsedPage } from "@/lib/documents/parse";

interface EvidenceRow {
  value: unknown;
  evidenceState: string;
  sourcePage: number | null;
}

function formatEvidence(label: string, row: EvidenceRow | undefined): string {
  if (!row) return `${label}: not found`;
  const text =
    typeof row.value === "object" && row.value !== null && "text" in row.value
      ? String((row.value as { text: unknown }).text)
      : "";
  const page = row.sourcePage ? ` (Page ${row.sourcePage})` : "";
  return `${label} [${row.evidenceState}]: ${text || "(none)"}${page}`;
}

/**
 * The structured analysis (case row + child tables) formatted as prompt
 * text, plus the original normalized document text — the two inputs AI Help
 * (Feature 13) grounds its answers in (build-plan.md: "the document is the
 * primary source"). There's no persisted `DocumentAnalysis` blob to reuse
 * (Feature 10 decomposes it into relational rows via persist-analysis.ts),
 * so this reconstructs a compact text projection from those rows instead.
 */
export async function loadCaseContext(
  caseId: string,
  userId: string,
): Promise<{ factsText: string; documentText: string }> {
  const caseRow = await withUser(userId, (tx) =>
    tx.case.findUnique({
      where: { id: caseId },
      include: {
        document: { select: { extractedTextBlobPath: true } },
        extractions: true,
        deadlines: true,
        tasks: true,
        requiredMaterials: true,
        submissionMethods: true,
      },
    }),
  );
  if (!caseRow) throw new Error(AUTH_ERRORS.notFound);

  const extraction = (field: string) => caseRow.extractions.find((e) => e.field === field);

  const factsLines = [
    `Document type: ${caseRow.documentType}`,
    `Issuer: ${caseRow.issuer ?? "not stated"}`,
    `Issue date: ${caseRow.issueDate?.toISOString().slice(0, 10) ?? "not stated"}`,
    `Action status: ${caseRow.actionStatus}`,
    `Urgency: ${caseRow.urgency}`,
    `Summary: ${caseRow.summary}`,
    formatEvidence("What this is", extraction("whatThisIs")),
    formatEvidence("Why received", extraction("whyReceived")),
    formatEvidence("If you do nothing", extraction("consequences")),
    "Deadlines:",
    ...(caseRow.deadlines.length
      ? caseRow.deadlines.map(
          (d) =>
            `- ${d.description}${d.date ? ` (${d.date.toISOString().slice(0, 10)})` : ""}${d.sourcePage ? ` (Page ${d.sourcePage})` : ""}`,
        )
      : ["- none stated"]),
    "Tasks (What To Do):",
    ...(caseRow.tasks.length
      ? caseRow.tasks.map(
          (t) =>
            `- [${t.required ? "required" : "optional"}${t.status === "completed" ? ", done" : ""}] ${t.title}${t.sourcePage ? ` (Page ${t.sourcePage})` : ""}`,
        )
      : ["- none"]),
    "Required materials (What You Need):",
    ...(caseRow.requiredMaterials.length
      ? caseRow.requiredMaterials.map(
          (m) => `- [${m.required ? "required" : "optional"}] ${m.name}${m.sourcePage ? ` (Page ${m.sourcePage})` : ""}`,
        )
      : ["- none"]),
    "Submission methods (Where To Send It):",
    ...(caseRow.submissionMethods.length
      ? caseRow.submissionMethods.map((s) => `- ${s.method}${s.destination ? ` -> ${s.destination}` : ""}`)
      : ["- none stated"]),
    `Uncertainties: ${caseRow.uncertainties.length ? caseRow.uncertainties.join("; ") : "none"}`,
  ];

  let documentText = "(original document text unavailable)";
  if (caseRow.document.extractedTextBlobPath) {
    const file = await readPrivateFile(caseRow.document.extractedTextBlobPath);
    const pages: ParsedPage[] = JSON.parse(new TextDecoder().decode(file.data));
    documentText = pages.map((p) => `--- Page ${p.pageNumber} ---\n${p.text}`).join("\n\n");
  }

  return { factsText: factsLines.join("\n"), documentText };
}
