import { PostHog } from "posthog-node";

/**
 * flushAt: 1 / flushInterval: 0 send every event immediately — server
 * functions (API routes, Trigger.dev jobs) can exit right after capture()
 * without losing buffered events. Returns null when NEXT_PUBLIC_POSTHOG_KEY
 * isn't set so callers can no-op instead of crashing.
 */
let client: PostHog | null = null;
let attempted = false;

export function getPostHogServerClient(): PostHog | null {
  if (!attempted) {
    attempted = true;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (key) {
      client = new PostHog(key, {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        flushAt: 1,
        flushInterval: 0,
      });
    }
  }
  return client;
}
