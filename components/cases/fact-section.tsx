import { Card } from "@/components/ui/card";
import { EvidenceTag, SourcePageTag } from "@/components/cases/evidence-tag";
import { ReportErrorButton } from "@/components/cases/report-error-button";
import type { EvidenceState } from "@/lib/generated/prisma/enums";

export interface EvidenceValue {
  text: string;
  evidenceState: EvidenceState;
  sourcePage?: number;
}

interface FactSectionProps {
  heading: string;
  value: EvidenceValue | null;
  fallback?: string;
  /** Present once real data is wired (Feature 11) — enables "Report an error". */
  report?: { userId: string; caseId: string; errorType: string };
}

/** Shared shape for What This Is / Why You Received It / If You Do Nothing. */
export function FactSection({ heading, value, fallback = "Not stated", report }: FactSectionProps) {
  const isMissing = !value || value.evidenceState === "not_found";
  return (
    <Card>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-black tracking-tight text-xl md:text-2xl">{heading}</h2>
        <div className="flex items-center gap-2">
          {value && <EvidenceTag state={value.evidenceState} />}
          {value?.sourcePage && <SourcePageTag page={value.sourcePage} />}
        </div>
      </div>
      <p className="font-mono text-sm md:text-base leading-relaxed mt-2 text-black/80">
        {isMissing ? fallback : value.text}
      </p>
      {report && (
        <div className="mt-3">
          <ReportErrorButton {...report} />
        </div>
      )}
    </Card>
  );
}
