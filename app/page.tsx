import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Footer } from "@/components/footer";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Upload",
    description: "Drop in a government letter, insurance notice, medical bill, or any confusing document — PDF or photo.",
  },
  {
    step: "02",
    title: "Understand",
    description: "bujhAI reads it and explains what it is, why you got it, and whether you need to act.",
  },
  {
    step: "03",
    title: "Get It Done",
    description: "Get a deadline, a checklist, and exactly where to send it — plus AI help to draft your response.",
  },
];

const VALUE_PROPS = [
  { label: "What It Is", accent: "#00d9ff", text: "A plain-language explanation of the document — no legal or institutional jargon." },
  { label: "Action Required", accent: "#ff006e", text: "Required, recommended, or no action — stated clearly, never left ambiguous." },
  { label: "Deadline", accent: "#ff9500", text: "The exact date if it's stated, marked uncertain if it's inferred, and 'Not stated' if it's missing." },
  { label: "What To Do", accent: "#ccff00", text: "A numbered checklist, with required and optional steps clearly separated." },
  { label: "What You Need", accent: "#00d9ff", text: "The documents and information to gather before you act." },
  { label: "Where To Send It", accent: "#ff006e", text: "The exact contact, portal, or address the document points to." },
];

export default function Home() {
  return (
    <>
      <section className="bg-[#ccff00] text-black py-12 md:py-24 lg:py-32 px-4 md:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto flex flex-col gap-6 md:gap-8">
          <h1 className="font-black tracking-tight text-4xl md:text-6xl lg:text-8xl leading-tight">
            Don&apos;t just understand your paperwork. Get it done.
          </h1>
          <p className="font-mono text-sm md:text-base max-w-xl leading-relaxed">
            Upload any confusing document and bujhAI turns it into a clear action
            plan — what it is, whether you need to act, when it&apos;s due, and
            exactly what to do next.
          </p>
          <div>
            <Show when="signed-in">
              <Link href="/dashboard" className={buttonVariants({ size: "default" })}>
                Upload Document
              </Link>
            </Show>
            <Show when="signed-out">
              <Link href="/login" className={buttonVariants({ size: "default" })}>
                Upload Document
              </Link>
            </Show>
          </div>
        </div>
      </section>

      <section className="bg-white text-black py-12 md:py-24 lg:py-32 px-4 md:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-black tracking-tight text-2xl md:text-4xl">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8">
            {HOW_IT_WORKS.map((item) => (
              <Card key={item.step}>
                <span className="font-mono text-xs uppercase tracking-wider text-black/60">
                  Step {item.step}
                </span>
                <h3 className="font-black tracking-tight text-xl md:text-2xl mt-1">
                  {item.title}
                </h3>
                <p className="font-mono text-sm md:text-base leading-relaxed mt-2 text-black/80">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white text-black py-12 md:py-24 lg:py-32 px-4 md:px-8 lg:px-12 border-t-2 md:border-t-4 border-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-black tracking-tight text-2xl md:text-4xl">
            More Than A Summary
          </h2>
          <p className="font-mono text-sm md:text-base leading-relaxed mt-2 max-w-2xl text-black/80">
            Every uploaded document becomes a full action plan, not just a
            shorter version of the same confusing text.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8">
            {VALUE_PROPS.map((item) => (
              <Card key={item.label}>
                <span
                  className="inline-block font-mono text-xs uppercase tracking-wider border-2 border-black px-2 py-1"
                  style={{ backgroundColor: item.accent }}
                >
                  {item.label}
                </span>
                <p className="font-mono text-sm md:text-base leading-relaxed mt-3 text-black/80">
                  {item.text}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
