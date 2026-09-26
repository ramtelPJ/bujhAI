import type { ActionStatus } from "@/lib/generated/prisma/enums";

const STATUS_LABELS: Record<ActionStatus, string> = {
  required: "Action Required",
  recommended: "Recommended",
  not_required: "No Action Needed",
  unknown: "Unknown",
  deadline_passed: "Deadline Passed",
};

const STATUS_COLORS: Record<ActionStatus, string> = {
  required: "#ff006e",
  recommended: "#ff9500",
  not_required: "#ccff00",
  unknown: "#ffffff",
  deadline_passed: "#000000",
};

const STATUS_TEXT: Record<ActionStatus, string> = {
  required: "text-white",
  recommended: "text-black",
  not_required: "text-black",
  unknown: "text-black",
  deadline_passed: "text-white",
};

export function StatusBadge({ status }: { status: ActionStatus }) {
  return (
    <span
      className={`inline-block font-black font-mono text-xs md:text-sm uppercase tracking-wider border-2 md:border-4 border-black px-3 py-1.5 md:px-4 md:py-2 ${STATUS_TEXT[status]}`}
      style={{ backgroundColor: STATUS_COLORS[status] }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
