import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ProcessingStatusTag } from "@/components/documents/processing-status-tag";
import type { RecentDocumentItem } from "@/app/dashboard/get-dashboard-data";

export function RecentDocumentsList({ documents }: { documents: RecentDocumentItem[] }) {
  return (
    <Card>
      <h2 className="font-black tracking-tight text-xl md:text-2xl">Recently Analyzed</h2>
      {documents.length === 0 ? (
        <p className="font-mono text-sm md:text-base mt-2 text-black/60">No documents yet.</p>
      ) : (
        <div className="flex flex-col gap-3 mt-3">
          {documents.map((item) => (
            <Link
              key={item.documentId}
              // `/cases/[id]` accepts either a caseId (once ready) or the source documentId.
              href={`/cases/${item.caseId ?? item.documentId}`}
              className="flex items-center justify-between gap-3 border-t-2 border-black/10 pt-3 first:border-t-0 first:pt-0 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#00d9ff] focus-visible:ring-offset-2"
            >
              <p className="font-mono text-sm md:text-base truncate">{item.label}</p>
              <ProcessingStatusTag status={item.processingStatus} />
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
