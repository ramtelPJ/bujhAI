import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { AUTH_ERRORS } from "@/lib/auth/errors";
import { getCaseDetail } from "./get-case-detail";
import { CaseView } from "@/components/cases/case-view";
import { ProcessingState } from "@/components/cases/processing-state";
import { FailedState } from "@/components/cases/failed-state";

/**
 * `/cases/[id]` accepts either a documentId (while processing/failed, before
 * a case exists) or a caseId (once ready) — see get-case-detail.ts. Ownership
 * errors render inline since this page has no shared error boundary yet.
 */
export default async function CasePage({ params }: PageProps<"/cases/[id]">) {
  const { id } = await params;
  const user = await getCurrentUser();

  let result;
  try {
    result = await getCaseDetail(id, user.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : AUTH_ERRORS.generic;
    return (
      <section className="bg-white text-black py-12 md:py-24 px-4 md:px-8 lg:px-12">
        <div className="max-w-2xl mx-auto rounded-none border-2 border-black bg-[#ff006e] text-white font-mono text-sm md:text-base px-4 py-3 md:px-6 md:py-4">
          {message}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white text-black py-12 md:py-24 px-4 md:px-8 lg:px-12">
      {result.status === "processing" && <ProcessingState />}
      {result.status === "failed" && <FailedState message={result.processingError} />}
      {result.status === "ready" && <CaseView caseDetail={result.caseDetail} userId={user.id} />}
    </section>
  );
}
