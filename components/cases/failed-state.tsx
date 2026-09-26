import { Button } from "@/components/ui/button";

/** Exact string required by authentiation-security.md §4 — the generic fallback. */
const DEFAULT_MESSAGE = "We couldn't finish analyzing this document.";

/**
 * Retry is inert here — the real Retry button (Feature 09) lives on /upload,
 * which is where a document reaches "failed" the first time. This page
 * shows the same real `document.processingError` from Feature 11 onward
 * (either Feature 09's or Feature 10's exact §4 message, whichever stage failed).
 */
export function FailedState({ message }: { message?: string | null }) {
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      <div className="rounded-none border-2 border-black bg-[#ff006e] text-white font-mono text-xs md:text-sm px-3 py-2 md:px-4 md:py-3">
        {message ?? DEFAULT_MESSAGE}
      </div>
      <Button variant="secondary" className="self-start">
        Retry
      </Button>
    </div>
  );
}
