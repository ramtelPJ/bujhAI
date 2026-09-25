"use client";

import { useEffect } from "react";
import { initPostHog, posthog } from "@/lib/analytics/posthog-client";

/** Initializes PostHog once, then identifies/resets whenever auth state changes. */
export function PostHogBoot({ userId }: { userId: string | null }) {
  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (userId) {
      posthog.identify(userId);
    } else {
      posthog.reset();
    }
  }, [userId]);

  return null;
}
