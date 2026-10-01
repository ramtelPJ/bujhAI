import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/dates";
import type { CompletedCaseItem } from "@/app/history/get-history-data";

export function CompletedCasesList({ cases }: { cases: CompletedCaseItem[] }) {
  return (
    <Card>
      <h2 className="font-black tracking-tight text-xl md:text-2xl">Completed Cases</h2>
      {cases.length === 0 ? (
        <p className="font-mono text-sm md:text-base mt-2 text-black/60">No completed cases yet.</p>
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
              <span className="shrink-0 font-mono text-xs md:text-sm text-black/80">
                Completed {formatDate(item.completedDate)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
