/**
 * Shared by the case page (`get-case-detail.ts`) and the dashboard
 * (`get-dashboard-data.ts`) — both need to resolve a case's `primaryDeadline`
 * scalar back to its source `Deadline` row for description/confidence.
 *
 * ponytail: flat threshold, add a real evidenceState column on Deadline if
 * "confident" vs "uncertain" ever needs to be more precise than this.
 */
export const UNCERTAIN_CONFIDENCE_THRESHOLD = 0.7;

/** The case's `primaryDeadline` pick, mapped back to its source row. */
export function pickPrimaryDeadline<T extends { date: Date | null }>(
  deadlines: T[],
  primaryDeadline: Date | null,
): T | null {
  if (deadlines.length === 0) return null;
  if (primaryDeadline) {
    const match = deadlines.find((d) => d.date && d.date.getTime() === primaryDeadline.getTime());
    if (match) return match;
  }
  return deadlines[0];
}
