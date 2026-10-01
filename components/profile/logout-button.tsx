"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { posthog } from "@/lib/analytics/posthog-client";

/**
 * `PostHogBoot` already resets PostHog when the layout re-renders with a null
 * userId, but that depends on a server re-render picking up the cleared
 * session — calling `posthog.reset()` directly here (build-plan.md's
 * explicit requirement) makes it happen immediately, not incidentally.
 */
export function LogoutButton() {
  const { signOut } = useClerk();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    posthog.reset();
    await signOut({ redirectUrl: "/" });
  }

  return (
    <Button variant="secondary" onClick={handleLogout} disabled={loggingOut}>
      {loggingOut ? "Logging Out…" : "Log Out"}
    </Button>
  );
}
