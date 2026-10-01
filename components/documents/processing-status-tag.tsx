import type { ProcessingStatus } from "@/lib/generated/prisma/enums";

const STATUS_LABEL: Record<ProcessingStatus, string> = {
  uploaded: "Uploaded",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
};

const STATUS_BG: Record<ProcessingStatus, string> = {
  uploaded: "bg-white",
  processing: "bg-[#00d9ff]",
  ready: "bg-[#ccff00]",
  failed: "bg-[#ff006e] text-black",
};

/** Shared by the dashboard's Recently Analyzed list and the History page's Previous Documents list. */
export function ProcessingStatusTag({ status }: { status: ProcessingStatus }) {
  return (
    <span
      className={`shrink-0 font-mono text-[10px] md:text-xs uppercase tracking-wider border-2 border-black px-1.5 py-0.5 ${STATUS_BG[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
