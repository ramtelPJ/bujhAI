"use client";

import posthog from "posthog-js";

/**
 * No-ops when NEXT_PUBLIC_POSTHOG_KEY isn't set (e.g. local dev without
 * analytics credentials) instead of throwing — posthog-js itself warns and
 * safely skips capture/identify calls made before init.
 */
let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, { api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST });
  initialized = true;
}

export { posthog };
