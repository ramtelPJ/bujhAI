import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/** Shown to a user with no documents at all — shared by the Dashboard and History pages. */
export function EmptyState() {
  return (
    <div className="flex flex-col gap-4 items-start">
      <div>
        <h2 className="font-black tracking-tight text-xl md:text-2xl">No documents yet</h2>
        <p className="font-mono text-sm md:text-base mt-2 text-black/70 max-w-md">
          Upload a confusing document — a government letter, insurance notice, medical bill,
          or anything else — and bujhAI will turn it into a clear action plan.
        </p>
      </div>
      <Link href="/upload" className={buttonVariants({ size: "default" })}>
        Upload Document
      </Link>
    </div>
  );
}
