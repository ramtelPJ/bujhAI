import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/cases/status-badge";
import { formatDate } from "@/lib/dates";
import type { ActiveCaseItem } from "@/app/dashboard/get-dashboard-data";

export function ActiveCasesList({ cases }: { cases: ActiveCaseItem[] }) {
  return (
    <Card>
      <h2 className="font-black tracking-tight text-xl md:text-2xl">Active Cases</h2>
      {cases.length === 0 ? (
        <p className="font-mono text-sm md:text-base mt-2 text-black/60">No active cases.</p>
      ) : (
        <div className="flex flex-col gap-3 mt-3">
          {cases.map((item) => (
            <Link
              key={item.caseId}
              href={`/cases/${item.caseId}`}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-t-2 border-black/10 pt-3 first:border-t-0 first:pt-0 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#00d9ff] focus-visible:ring-offset-2"
            >
              <div>
                <p className="font-mono text-sm md:text-base">{item.documentType}</p>
                <p className="font-mono text-xs md:text-sm text-black/60">{item.issuer ?? "Issuer not stated"}</p>
              </div>
              <div className="shrink-0 flex items-center gap-2 flex-wrap">
                <StatusBadge status={item.actionStatus} />
                <span className="font-mono text-xs md:text-sm text-black/80">
                  {item.deadline ? formatDate(item.deadline) : "Not stated"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
