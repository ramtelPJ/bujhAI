import Link from "next/link";
import type { CaseStatus } from "@/lib/generated/prisma/enums";
import { formatDate } from "@/lib/dates";

interface CaseHeaderProps {
  documentType: string;
  issuer: string | null;
  issueDate: string | null;
  caseStatus: CaseStatus;
}

export function CaseHeader({ documentType, issuer, issueDate, caseStatus }: CaseHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard"
        className="font-mono text-xs md:text-sm uppercase tracking-wider hover:underline w-fit"
      >
        ← Back to Dashboard
      </Link>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-black tracking-tight text-3xl md:text-5xl">{documentType}</h1>
          <p className="font-mono text-sm md:text-base text-black/70 mt-1">
            {issuer ?? "Issuer not stated"}
            {issueDate ? ` · ${formatDate(issueDate)}` : ""}
          </p>
        </div>
        <span className="font-mono text-xs md:text-sm uppercase tracking-wider border-2 border-black px-3 py-1.5 bg-white shrink-0">
          {caseStatus === "completed" ? "Completed" : "Active"}
        </span>
      </div>
    </div>
  );
}
