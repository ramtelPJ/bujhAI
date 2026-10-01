import { Card } from "@/components/ui/card";

/** "3 actions need attention" — project-overview.md's dashboard example. */
export function AttentionBanner({ count }: { count: number }) {
  if (count === 0) {
    return (
      <Card>
        <p className="font-black tracking-tight text-xl md:text-2xl">Nothing needs attention right now</p>
      </Card>
    );
  }

  return (
    <Card className="bg-[#ff006e] text-black">
      <p className="font-black tracking-tight text-xl md:text-2xl">
        {count} {count === 1 ? "action" : "actions"} need attention
      </p>
    </Card>
  );
}
