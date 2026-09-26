import { Card } from "@/components/ui/card";

export function UncertaintiesSection({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <Card>
      <h2 className="font-black tracking-tight text-xl md:text-2xl">Uncertainties</h2>
      <ul className="flex flex-col gap-2 mt-3">
        {items.map((text, i) => (
          <li key={i} className="flex items-start gap-2 font-mono text-sm md:text-base text-black/80">
            <span className="shrink-0 font-black" style={{ color: "#ff9500" }} aria-hidden>
              !
            </span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
