import { currentUser } from "@clerk/nextjs/server";
import { Card } from "@/components/ui/card";
import { LogoutButton } from "@/components/profile/logout-button";

/**
 * Only Clerk-managed account info (name, email) is shown — no onboarding
 * questionnaire or app-side profile data exists (build-plan.md Feature 19).
 */
export default async function ProfilePage() {
  const clerkUser = await currentUser();
  const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || null;
  const email =
    clerkUser?.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    null;

  return (
    <section className="bg-white text-black py-12 md:py-24 px-4 md:px-8 lg:px-12">
      <div className="max-w-2xl mx-auto flex flex-col gap-4 md:gap-6">
        <h1 className="font-black tracking-tight text-3xl md:text-5xl">Profile</h1>

        <Card>
          <h2 className="font-black tracking-tight text-xl md:text-2xl">Account</h2>
          <div className="flex flex-col gap-3 mt-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-black/60">Name</p>
              <p className="font-mono text-sm md:text-base mt-1">{name ?? "Not set"}</p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-black/60">Email</p>
              <p className="font-mono text-sm md:text-base mt-1">{email ?? "Not set"}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-black tracking-tight text-xl md:text-2xl">Preferences</h2>
          <p className="font-mono text-sm md:text-base mt-2 text-black/60">Nothing to configure yet.</p>
        </Card>

        <Card>
          <LogoutButton />
        </Card>
      </div>
    </section>
  );
}
