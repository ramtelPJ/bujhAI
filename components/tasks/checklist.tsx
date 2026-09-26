import { SourcePageTag } from "@/components/cases/evidence-tag";

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  required: boolean;
  completed: boolean;
  sourcePage?: number;
}

interface ChecklistProps {
  items: ChecklistItem[];
  onToggle: (id: string) => void;
  /** Numbered ordered list for tasks ("What to do"); plain checklist for materials. */
  numbered?: boolean;
}

/** Shared by "What To Do" (tasks) and "What You Need" (required materials). */
export function Checklist({ items, onToggle, numbered = false }: ChecklistProps) {
  const required = items.filter((item) => item.required);
  const optional = items.filter((item) => !item.required);

  if (items.length === 0) {
    return <p className="font-mono text-sm text-black/60">Nothing needed here.</p>;
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {required.length > 0 && <ChecklistGroup label="Required" items={required} startIndex={0} numbered={numbered} onToggle={onToggle} />}
      {optional.length > 0 && (
        <ChecklistGroup label="Optional" items={optional} startIndex={required.length} numbered={numbered} onToggle={onToggle} />
      )}
    </div>
  );
}

function ChecklistGroup({
  label,
  items,
  startIndex,
  numbered,
  onToggle,
}: {
  label: string;
  items: ChecklistItem[];
  startIndex: number;
  numbered: boolean;
  onToggle: (id: string) => void;
}) {
  const List = numbered ? "ol" : "ul";
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wider text-black/60 mb-2">{label}</p>
      <List className="flex flex-col gap-2 md:gap-3">
        {items.map((item, i) => (
          <li key={item.id} className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => onToggle(item.id)}
              aria-label={item.title}
              className="mt-1 w-5 h-5 shrink-0 rounded-none border-2 border-black accent-[#ff006e] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#00d9ff] focus-visible:ring-offset-2"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {numbered && <span className="font-black">{startIndex + i + 1}.</span>}
                <span
                  className={`font-mono text-sm md:text-base ${item.completed ? "line-through text-black/50" : ""}`}
                >
                  {item.title}
                </span>
                {item.sourcePage && <SourcePageTag page={item.sourcePage} />}
              </div>
              {item.description && (
                <p className="font-mono text-xs md:text-sm text-black/60 mt-1">{item.description}</p>
              )}
            </div>
          </li>
        ))}
      </List>
    </div>
  );
}
