import { Card } from "@/components/ui/card";
import { SourcePageTag } from "@/components/cases/evidence-tag";

export interface SubmissionMethodView {
  method: string;
  destination?: string;
  instructions?: string;
  sourcePage?: number;
}

export function SubmissionSection({ methods }: { methods: SubmissionMethodView[] }) {
  return (
    <Card>
      <h2 className="font-black tracking-tight text-xl md:text-2xl">Where To Send It</h2>
      {methods.length === 0 ? (
        <p className="font-mono text-sm md:text-base mt-2 text-black/60">Not stated</p>
      ) : (
        <div className="flex flex-col gap-4 mt-3">
          {methods.map((method, i) => (
            <div key={i} className="border-t-2 border-black/10 pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs uppercase tracking-wider border-2 border-black px-2 py-0.5">
                  {method.method}
                </span>
                {method.sourcePage && <SourcePageTag page={method.sourcePage} />}
              </div>
              {method.destination && (
                <p className="font-mono text-sm md:text-base mt-1">{method.destination}</p>
              )}
              {method.instructions && (
                <p className="font-mono text-xs md:text-sm text-black/60 mt-1">{method.instructions}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
