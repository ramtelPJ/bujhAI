import { EmptyState } from "@/components/empty-state";
import { CompletedCasesList } from "@/components/history/completed-cases-list";
import { PreviousDocumentsList } from "@/components/history/previous-documents-list";
import type { HistoryData } from "@/app/history/get-history-data";

export function HistoryView({ data }: { data: HistoryData }) {
  const isEmpty = data.completedCases.length === 0 && data.documents.length === 0;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4 md:gap-6">
      <h1 className="font-black tracking-tight text-3xl md:text-5xl">History</h1>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          <CompletedCasesList cases={data.completedCases} />
          <PreviousDocumentsList documents={data.documents} />
        </>
      )}
    </div>
  );
}
