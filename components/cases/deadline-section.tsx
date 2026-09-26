import { Card } from "@/components/ui/card";
import { EvidenceTag, SourcePageTag } from "@/components/cases/evidence-tag";
import { ReportErrorButton } from "@/components/cases/report-error-button";
import type { ActionStatus, EvidenceState } from "@/lib/generated/prisma/enums";
import { formatDate } from "@/lib/dates";

export interface DeadlineView {
  date: string | null;
  description: string;
  evidenceState: EvidenceState;
  sourcePage?: number;
}

interface DeadlineSectionProps {
  deadline: DeadlineView | null;
  actionStatus: ActionStatus;
  /** Present once real data is wired (Feature 11) — enables "Report an error". */
  report?: { userId: string; caseId: string; errorType: string };
}

export function DeadlineSection({ deadline, actionStatus, report }: DeadlineSectionProps) {
  const isPassed = actionStatus === "deadline_passed";
  const isMissing = !deadline || deadline.evidenceState === "not_found" || !deadline.date;
  const label = isMissing ? "Not stated" : formatDate(deadline.date as string);

  return (
    <Card className={isPassed ? "bg-black text-white" : undefined}>
      <p
        className={`font-mono text-xs md:text-sm uppercase tracking-wider ${isPassed ? "text-white/70" : "text-black/60"}`}
      >
        Deadline
      </p>
      <p className="font-black tracking-tight text-2xl md:text-4xl mt-1">{label}</p>
      <div className="flex items-center gap-2 mt-2">
        {deadline && <EvidenceTag state={deadline.evidenceState} />}
        {deadline?.sourcePage && <SourcePageTag page={deadline.sourcePage} />}
      </div>
      {deadline?.description && (
        <p className={`font-mono text-sm md:text-base mt-2 ${isPassed ? "text-white/80" : "text-black/80"}`}>
          {deadline.description}
        </p>
      )}
      {report && (
        <div className="mt-3">
          <ReportErrorButton {...report} tone={isPassed ? "light" : "dark"} />
        </div>
      )}
    </Card>
  );
}
