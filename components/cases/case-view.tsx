"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checklist } from "@/components/tasks/checklist";
import { CaseHeader } from "@/components/cases/case-header";
import { StatusBadge } from "@/components/cases/status-badge";
import { DeadlineSection } from "@/components/cases/deadline-section";
import { FactSection } from "@/components/cases/fact-section";
import { SubmissionSection } from "@/components/cases/submission-section";
import { UncertaintiesSection } from "@/components/cases/uncertainties-section";
import { AiHelpPanel } from "@/components/cases/ai-help-panel";
import { NotesSection } from "@/components/cases/notes-section";
import { trackClientEvent } from "@/lib/analytics/events";
import type { CaseDetail } from "@/app/cases/[id]/get-case-detail";

export function CaseView({ caseDetail, userId }: { caseDetail: CaseDetail; userId: string }) {
  const [tasks, setTasks] = useState(caseDetail.tasks);
  const [materials, setMaterials] = useState(caseDetail.requiredMaterials);

  useEffect(() => {
    trackClientEvent("deadline_viewed", { userId, caseId: caseDetail.id });
    // Fire once per case page view, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseDetail.id]);

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }

  function toggleMaterial(id: string) {
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m)));
  }

  const report = (errorType: string) => ({ userId, caseId: caseDetail.id, errorType });

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4 md:gap-6">
      <CaseHeader
        documentType={caseDetail.documentType}
        issuer={caseDetail.issuer}
        issueDate={caseDetail.issueDate}
        caseStatus={caseDetail.caseStatus}
      />

      <FactSection heading="What This Is" value={caseDetail.whatThisIs} report={report("whatThisIs")} />
      <FactSection heading="Why You Received It" value={caseDetail.whyReceived} report={report("whyReceived")} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <p className="font-mono text-xs uppercase tracking-wider text-black/60">Your Status</p>
          <div className="mt-2">
            <StatusBadge status={caseDetail.actionStatus} />
          </div>
        </Card>
        <DeadlineSection
          deadline={caseDetail.deadline}
          actionStatus={caseDetail.actionStatus}
          report={report("deadline")}
        />
      </div>

      <Card>
        <h2 className="font-black tracking-tight text-xl md:text-2xl">What To Do</h2>
        <div className="mt-3">
          <Checklist items={tasks} onToggle={toggleTask} numbered />
        </div>
      </Card>

      <Card>
        <h2 className="font-black tracking-tight text-xl md:text-2xl">What You Need</h2>
        <div className="mt-3">
          <Checklist items={materials} onToggle={toggleMaterial} />
        </div>
      </Card>

      <SubmissionSection methods={caseDetail.submissionMethods} />

      <FactSection heading="If You Do Nothing" value={caseDetail.consequences} report={report("consequences")} />

      <Card>
        <h2 className="font-black tracking-tight text-xl md:text-2xl">Next Step</h2>
        <p className="font-mono text-sm md:text-base mt-2 text-black/80">
          bujhAI can draft a response, email, or letter based on this case. You always review
          and send it yourself — bujhAI never sends anything for you.
        </p>
        <Button className="mt-4">Draft a Response</Button>
      </Card>

      <UncertaintiesSection items={caseDetail.uncertainties} />

      <Card>
        <h2 className="font-black tracking-tight text-xl md:text-2xl">Original Document</h2>
        <a
          href={caseDetail.originalDocumentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block font-mono text-sm md:text-base mt-2 underline hover:no-underline"
        >
          View Original Document
        </a>
      </Card>

      <AiHelpPanel />

      <NotesSection initialNotes={caseDetail.notes} />

      <Card className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <p className="font-mono text-sm md:text-base text-black/80">
          Done with this case? Mark it complete — the document and your history stay accessible.
        </p>
        <Button variant="secondary" className="shrink-0">
          Mark Case Complete
        </Button>
      </Card>
    </div>
  );
}
