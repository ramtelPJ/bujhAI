import type { ActionStatus, Urgency, DraftType } from "@/lib/generated/prisma/enums";
import { posthog as posthogClient } from "./posthog-client";
import { getPostHogServerClient } from "./posthog-server";

/**
 * Every product event from project-overview.md, with exactly the properties
 * listed there — never raw document/OCR/extracted text.
 */
export type AnalyticsEvents = {
  document_upload_started: { userId: string };
  document_uploaded: { userId: string; fileType: string; pageCount: number };
  document_analysis_started: { userId: string; caseId: string };
  document_analysis_completed: {
    userId: string;
    caseId: string;
    actionStatus: ActionStatus;
    urgency: Urgency;
  };
  deadline_viewed: { userId: string; caseId: string };
  task_completed: { userId: string; caseId: string; taskId: string };
  draft_generated: { userId: string; caseId: string; draftType: DraftType };
  assistant_question_asked: { userId: string; caseId: string };
  case_completed: { userId: string; caseId: string };
  correction_reported: { userId: string; caseId: string; errorType: string };
  document_deleted: { userId: string; caseId: string };
};

/** Client components — case page views, error reports, upload start. */
export function trackClientEvent<E extends keyof AnalyticsEvents>(
  event: E,
  properties: AnalyticsEvents[E],
) {
  posthogClient.capture(event, properties);
}

/** API routes and Trigger.dev jobs — distinctId is always the internal userId. */
export function trackServerEvent<E extends keyof AnalyticsEvents>(
  event: E,
  properties: AnalyticsEvents[E],
) {
  getPostHogServerClient()?.capture({ distinctId: properties.userId, event, properties });
}
