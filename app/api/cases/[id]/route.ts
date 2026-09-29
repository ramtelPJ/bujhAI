import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertCaseOwner } from "@/lib/auth/ownership";
import { withUser } from "@/lib/db/withUser";
import { AUTH_ERRORS } from "@/lib/auth/errors";
import { trackServerEvent } from "@/lib/analytics/server-events";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : AUTH_ERRORS.generic;
  const status =
    message === AUTH_ERRORS.notFound ? 404 : message === AUTH_ERRORS.forbidden ? 403 : 401;
  return NextResponse.json({ error: message }, { status });
}

/** "Mark Case Complete" button (Feature 12) — the only status transition this supports. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/cases/[id]">) {
  const { id } = await ctx.params;

  let user;
  try {
    user = await getCurrentUser();
    await assertCaseOwner(id, user.id);
  } catch (error) {
    return errorResponse(error);
  }

  const body = await request.json().catch(() => null);
  if (!body || body.status !== "completed") {
    return NextResponse.json({ error: AUTH_ERRORS.generic }, { status: 400 });
  }

  const caseRow = await withUser(user.id, (tx) =>
    tx.case.update({ where: { id }, data: { status: "completed" }, select: { id: true, status: true } }),
  );

  trackServerEvent("case_completed", { userId: user.id, caseId: caseRow.id });

  return NextResponse.json({ id: caseRow.id, status: caseRow.status });
}
