import { withUser } from "@/lib/db/withUser";
import { pickPrimaryDeadline, UNCERTAIN_CONFIDENCE_THRESHOLD } from "@/lib/cases/deadline";
import type { ActionStatus, ProcessingStatus } from "@/lib/generated/prisma/enums";

export interface DeadlineItem {
  caseId: string;
  documentType: string;
  description: string;
  /** ISO date string — items with no date don't reach the Upcoming Deadlines section at all. */
  date: string;
  uncertain: boolean;
}

export interface ActiveCaseItem {
  caseId: string;
  documentType: string;
  issuer: string | null;
  actionStatus: ActionStatus;
  /** ISO date string, or null when not stated. */
  deadline: string | null;
}

export interface RecentDocumentItem {
  documentId: string;
  /** null while still processing/failed — no case exists to link to yet. */
  caseId: string | null;
  label: string;
  processingStatus: ProcessingStatus;
}

export interface DashboardData {
  attentionCount: number;
  deadlinesToday: DeadlineItem[];
  deadlinesThisWeek: DeadlineItem[];
  deadlinesLater: DeadlineItem[];
  activeCases: ActiveCaseItem[];
  recentDocuments: RecentDocumentItem[];
}

/** How many recent documents the dashboard shows. */
const RECENT_DOCUMENTS_LIMIT = 10;

const WEEK_IN_DAYS = 7;

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** "Today" also catches overdue deadlines on cases not yet marked `deadline_passed` — most urgent bucket. */
function deadlineBucket(date: Date, now: Date): "today" | "thisWeek" | "later" {
  const daysUntil = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / 86_400_000);
  if (daysUntil <= 0) return "today";
  if (daysUntil <= WEEK_IN_DAYS) return "thisWeek";
  return "later";
}

/**
 * Dashboard (Feature 17) — replaces Feature 16's `getMockDashboardData()`.
 * Every query filtered by `userId` via RLS (`withUser`).
 */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  const activeCases = await withUser(userId, (tx) =>
    tx.case.findMany({
      where: { userId, status: "active" },
      orderBy: { primaryDeadline: { sort: "asc", nulls: "last" } },
      include: {
        deadlines: true,
        // Build-plan.md: "cases with pending required tasks" need attention too.
        tasks: { where: { required: true, status: "pending" }, select: { id: true } },
      },
    }),
  );

  const now = new Date();
  const deadlinesToday: DeadlineItem[] = [];
  const deadlinesThisWeek: DeadlineItem[] = [];
  const deadlinesLater: DeadlineItem[] = [];

  for (const c of activeCases) {
    const primary = pickPrimaryDeadline(c.deadlines, c.primaryDeadline);
    if (!primary?.date) continue;
    const item: DeadlineItem = {
      caseId: c.id,
      documentType: c.documentType,
      description: primary.description,
      date: primary.date.toISOString(),
      uncertain: primary.confidence.toNumber() < UNCERTAIN_CONFIDENCE_THRESHOLD,
    };
    const bucket = deadlineBucket(primary.date, now);
    if (bucket === "today") deadlinesToday.push(item);
    else if (bucket === "thisWeek") deadlinesThisWeek.push(item);
    else deadlinesLater.push(item);
  }

  const attentionCount = activeCases.filter(
    (c) => c.actionStatus === "required" || c.actionStatus === "deadline_passed" || c.tasks.length > 0,
  ).length;

  const activeCaseItems: ActiveCaseItem[] = activeCases.map((c) => ({
    caseId: c.id,
    documentType: c.documentType,
    issuer: c.issuer,
    actionStatus: c.actionStatus,
    deadline: c.primaryDeadline?.toISOString() ?? null,
  }));

  const documents = await withUser(userId, (tx) =>
    tx.document.findMany({
      where: { userId },
      orderBy: { uploadedAt: "desc" },
      take: RECENT_DOCUMENTS_LIMIT,
      select: {
        id: true,
        fileName: true,
        processingStatus: true,
        case: { select: { id: true, documentType: true } },
      },
    }),
  );

  const recentDocuments: RecentDocumentItem[] = documents.map((d) => ({
    documentId: d.id,
    caseId: d.case?.id ?? null,
    label: d.case?.documentType ?? d.fileName,
    processingStatus: d.processingStatus,
  }));

  return {
    attentionCount,
    deadlinesToday,
    deadlinesThisWeek,
    deadlinesLater,
    activeCases: activeCaseItems,
    recentDocuments,
  };
}
