"use client";

import { useState } from "react";
import { trackClientEvent } from "@/lib/analytics/events";

interface ReportErrorButtonProps {
  userId: string;
  caseId: string;
  /** Which extracted fact this is reporting — the only property besides ids the event carries. */
  errorType: string;
  /** "light" for use on the solid-black deadline-passed card. */
  tone?: "dark" | "light";
}

/** "Report an error option on extracted facts" (Feature 11) — fires the event, no backend record. */
export function ReportErrorButton({ userId, caseId, errorType, tone = "dark" }: ReportErrorButtonProps) {
  const [reported, setReported] = useState(false);
  const textColor = tone === "light" ? "text-white/70" : "text-black/50";

  if (reported) {
    return <span className={`font-mono text-[10px] md:text-xs uppercase tracking-wider ${textColor}`}>Reported</span>;
  }

  return (
    <button
      type="button"
      onClick={() => {
        trackClientEvent("correction_reported", { userId, caseId, errorType });
        setReported(true);
      }}
      className={`font-mono text-[10px] md:text-xs uppercase tracking-wider underline hover:no-underline ${textColor}`}
    >
      Report an error
    </button>
  );
}
