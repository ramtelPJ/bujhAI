import type { AnalyticsEvents } from "./events";
import { getPostHogServerClient } from "./posthog-server";

/**
 * API routes and Trigger.dev jobs only — distinctId is always the internal
 * userId. Kept out of events.ts because posthog-server.ts imports
 * posthog-node (Node-only); events.ts must stay importable from client
 * components without dragging that into the browser bundle.
 */
export function trackServerEvent<E extends keyof AnalyticsEvents>(
  event: E,
  properties: AnalyticsEvents[E],
) {
  getPostHogServerClient()?.capture({ distinctId: properties.userId, event, properties });
}
