import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardData } from "./get-dashboard-data";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const data = await getDashboardData(user.id);
  return (
    <section className="bg-white text-black py-12 md:py-24 px-4 md:px-8 lg:px-12">
      <DashboardView data={data} />
    </section>
  );
}
