const STEPS = ["Uploading", "Reading document", "Analyzing", "Building your action plan"];

interface ProcessingStepsProps {
  /** Index of the step currently in progress. */
  currentStep: number;
}

export function ProcessingSteps({ currentStep }: ProcessingStepsProps) {
  return (
    <div className="rounded-none border-2 md:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-4 md:p-8">
      <ol className="flex flex-col gap-4 md:gap-6">
        {STEPS.map((step, i) => {
          const isDone = i < currentStep;
          const isActive = i === currentStep;
          return (
            <li key={step} className="flex items-center gap-3 md:gap-4">
              <span
                className={`shrink-0 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-none border-2 md:border-4 border-black font-black text-sm md:text-base ${
                  isDone ? "bg-[#ccff00]" : isActive ? "bg-[#ff006e] text-white" : "bg-white text-black/60"
                }`}
              >
                {isDone ? "✓" : i + 1}
              </span>
              <span
                className={`font-mono text-sm md:text-base ${
                  isActive ? "font-bold" : isDone ? "text-black" : "text-black/60"
                }`}
              >
                {step}
                {isActive && "…"}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
