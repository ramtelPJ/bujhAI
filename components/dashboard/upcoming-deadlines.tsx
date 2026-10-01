import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/dates";
import type { DeadlineItem } from "@/app/dashboard/get-dashboard-data";

function DeadlineRow({ item }: { item: DeadlineItem }) {
  return (
    <Link
      href={`/cases/${item.caseId}`}
      className="flex items-center justify-between gap-3 border-t-2 border-black/10 pt-3 first:border-t-0 first:pt-0 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#00d9ff] focus-visible:ring-offset-2"
    >
      <div>
        <p className="font-mono text-sm md:text-base">{item.documentType}</p>
        <p className="font-mono text-xs md:text-sm text-black/60">{item.description}</p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {item.uncertain && (
          <span className="font-mono text-[10px] md:text-xs uppercase tracking-wider border-2 border-black px-1.5 py-0.5 bg-[#00d9ff]">
            Uncertain
          </span>
        )}
        <span className="font-mono text-xs md:text-sm text-black/80">
          {item.date ? formatDate(item.date) : "Not stated"}
        </span>
      </div>
    </Link>
  );
}

function DeadlineGroup({ heading, items }: { heading: string; items: DeadlineItem[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wider text-black/60">{heading}</p>
      <div className="flex flex-col gap-3 mt-2">
        {items.map((item) => (
          <DeadlineRow key={item.caseId} item={item} />
        ))}
      </div>
    </div>
  );
}

export function UpcomingDeadlines({
  today,
  thisWeek,
  later,
}: {
  today: DeadlineItem[];
  thisWeek: DeadlineItem[];
  later: DeadlineItem[];
}) {
  const isEmpty = today.length === 0 && thisWeek.length === 0 && later.length === 0;

  return (
    <Card>
      <h2 className="font-black tracking-tight text-xl md:text-2xl">Upcoming Deadlines</h2>
      {isEmpty ? (
        <p className="font-mono text-sm md:text-base mt-2 text-black/60">No upcoming deadlines.</p>
      ) : (
        <div className="flex flex-col gap-5 mt-3">
          <DeadlineGroup heading="Today" items={today} />
          <DeadlineGroup heading="This Week" items={thisWeek} />
          <DeadlineGroup heading="Later" items={later} />
        </div>
      )}
    </Card>
  );
}
