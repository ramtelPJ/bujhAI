import { ProcessingSteps } from "@/components/upload/processing-steps";

/**
 * Static snapshot for now — Feature 09 drives `currentStep` from the real
 * processingStatus and polls until the case is ready.
 */
export function ProcessingState() {
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-black tracking-tight text-2xl md:text-4xl">Analyzing your document</h1>
        <p className="font-mono text-sm md:text-base mt-2 text-black/70">
          bujhAI is reading your document and building your action plan.
        </p>
      </div>
      <ProcessingSteps currentStep={2} />
    </div>
  );
}
