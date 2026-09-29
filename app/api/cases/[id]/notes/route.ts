import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertCaseOwner } from "@/lib/auth/ownership";
import { withUser } from "@/lib/db/withUser";
import { AUTH_ERRORS } from "@/lib/auth/errors";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : AUTH_ERRORS.generic;
  const status =
    message === AUTH_ERRORS.notFound ? 404 : message === AUTH_ERRORS.forbidden ? 403 : 401;
  return NextResponse.json({ error: message }, { status });
}

/** Add-note form on the case page (Feature 12). */
export async function POST(request: Request, ctx: RouteContext<"/api/cases/[id]/notes">) {
  const { id: caseId } = await ctx.params;

  let user;
  try {
    user = await getCurrentUser();
    await assertCaseOwner(caseId, user.id);
  } catch (error) {
    return errorResponse(error);
  }

  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: AUTH_ERRORS.generic }, { status: 400 });
  }

  const note = await withUser(user.id, (tx) =>
    tx.caseNote.create({ data: { caseId, userId: user.id, content } }),
  );

  return NextResponse.json({ id: note.id, content: note.content, createdAt: note.createdAt });
}
