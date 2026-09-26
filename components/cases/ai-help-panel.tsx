import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const EXAMPLE_QUESTIONS = [
  "What is this?",
  "Do I need to do anything?",
  "When is this due?",
  "What do I need to send?",
  "Where do I send it?",
  "What happens if I do nothing?",
  "Explain page 3",
];

/**
 * Empty state only — Feature 13 adds the real message list, loading state,
 * and wires the input/example chips to a live conversation.
 */
export function AiHelpPanel() {
  return (
    <Card>
      <h2 className="font-black tracking-tight text-xl md:text-2xl">AI Help</h2>
      <p className="font-mono text-sm md:text-base mt-2 text-black/80">
        Ask a question about this document. bujhAI answers using the document itself and
        tells you when it&apos;s not sure.
      </p>
      <div className="flex flex-wrap gap-2 mt-4">
        {EXAMPLE_QUESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            disabled
            className="font-mono text-xs md:text-sm border-2 border-black px-3 py-1.5 bg-white disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <Input placeholder="Ask a question…" disabled />
        <Button size="sm" disabled>
          Ask
        </Button>
      </div>
    </Card>
  );
}
