import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { HistoryView } from "@/components/history/history-view";
import { getHistoryData } from "./get-history-data";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  const data = await getHistoryData(user.id);
  return (
    <section className="bg-white text-black py-12 md:py-24 px-4 md:px-8 lg:px-12">
      <HistoryView data={data} />
    </section>
  );
}
