import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertCaseOwner } from "@/lib/auth/ownership";
import { withUser } from "@/lib/db/withUser";
import { AUTH_ERRORS } from "@/lib/auth/errors";
import { trackServerEvent } from "@/lib/analytics/server-events";
import { loadCaseContext } from "@/lib/ai/case-context";
import { generateDraft } from "@/lib/ai/generate-draft";
import { DraftType } from "@/lib/generated/prisma/enums";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : AUTH_ERRORS.generic;
  const status =
    message === AUTH_ERRORS.notFound ? 404 : message === AUTH_ERRORS.forbidden ? 403 : 401;
  return NextResponse.json({ error: message }, { status });
}

const DRAFT_TYPES = new Set<string>(Object.values(DraftType));

/** "Draft a Response" on the case page (Feature 14) — generates a grounded, editable draft. */
export async function POST(request: Request) {
  let user;
  try {
    user = await getCurrentUser();
  } catch (error) {
    return errorResponse(error);
  }

  const body = await request.json().catch(() => null);
  const caseId = typeof body?.caseId === "string" ? body.caseId : "";
  const type = typeof body?.type === "string" ? body.type : "";
  const instructions = typeof body?.instructions === "string" ? body.instructions.trim() : undefined;
  if (!caseId || !DRAFT_TYPES.has(type)) {
    return NextResponse.json({ error: AUTH_ERRORS.generic }, { status: 400 });
  }
  const draftType = type as DraftType;

  try {
    await assertCaseOwner(caseId, user.id);
  } catch (error) {
    return errorResponse(error);
  }

  let generated;
  try {
    const context = await loadCaseContext(caseId, user.id);
    generated = await generateDraft({ ...context, draftType, instructions });
  } catch {
    return NextResponse.json({ error: AUTH_ERRORS.generic }, { status: 502 });
  }

  const draft = await withUser(user.id, (tx) =>
    tx.draft.create({ data: { caseId, userId: user.id, type: draftType, content: generated.content } }),
  );

  trackServerEvent("draft_generated", { userId: user.id, caseId, draftType: draft.type });

  return NextResponse.json({ id: draft.id, type: draft.type, content: draft.content, createdAt: draft.createdAt });
}
