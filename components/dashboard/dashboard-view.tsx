import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { AttentionBanner } from "@/components/dashboard/attention-banner";
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines";
import { ActiveCasesList } from "@/components/dashboard/active-cases-list";
import { RecentDocumentsList } from "@/components/dashboard/recent-documents-list";
import { EmptyState } from "@/components/empty-state";
import type { DashboardData } from "@/app/dashboard/get-dashboard-data";

export function DashboardView({ data }: { data: DashboardData }) {
  const isEmpty = data.activeCases.length === 0 && data.recentDocuments.length === 0;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-black tracking-tight text-3xl md:text-5xl">Dashboard</h1>
        {!isEmpty && (
          <Link href="/upload" className={buttonVariants({ size: "sm" })}>
            Upload Document
          </Link>
        )}
      </div>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          <AttentionBanner count={data.attentionCount} />
          <UpcomingDeadlines
            today={data.deadlinesToday}
            thisWeek={data.deadlinesThisWeek}
            later={data.deadlinesLater}
          />
          <ActiveCasesList cases={data.activeCases} />
          <RecentDocumentsList documents={data.recentDocuments} />
        </>
      )}
    </div>
  );
}
