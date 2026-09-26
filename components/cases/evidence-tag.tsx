import type { EvidenceState } from "@/lib/generated/prisma/enums";

/**
 * Explicit facts render with no tag — they're the default, trusted case.
 * Inferred/unknown/not_found get a visible tag so uncertainty is never
 * presented as a stated fact (architecture-context.md invariant #8).
 */
const EVIDENCE_LABELS: Partial<Record<EvidenceState, string>> = {
  inferred: "Inferred",
  unknown: "Unknown",
  not_found: "Not Found",
};

const EVIDENCE_COLORS: Partial<Record<EvidenceState, string>> = {
  inferred: "#00d9ff",
  unknown: "#ff9500",
  not_found: "#000000",
};

const EVIDENCE_TEXT: Partial<Record<EvidenceState, string>> = {
  inferred: "text-black",
  unknown: "text-black",
  not_found: "text-white",
};

export function EvidenceTag({ state }: { state: EvidenceState }) {
  if (state === "explicit") return null;
  return (
    <span
      className={`inline-block font-mono text-[10px] md:text-xs uppercase tracking-wider border-2 border-black px-1.5 py-0.5 ${EVIDENCE_TEXT[state]}`}
      style={{ backgroundColor: EVIDENCE_COLORS[state] }}
    >
      {EVIDENCE_LABELS[state]}
    </span>
  );
}

export function SourcePageTag({ page }: { page: number }) {
  return (
    <span className="inline-block font-mono text-[10px] md:text-xs uppercase tracking-wider border-2 border-black px-1.5 py-0.5 bg-white text-black/70">
      Page {page}
    </span>
  );
}
