import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertNoteOwner } from "@/lib/auth/ownership";
import { withUser } from "@/lib/db/withUser";
import { AUTH_ERRORS } from "@/lib/auth/errors";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : AUTH_ERRORS.generic;
  const status =
    message === AUTH_ERRORS.notFound ? 404 : message === AUTH_ERRORS.forbidden ? 403 : 401;
  return NextResponse.json({ error: message }, { status });
}

/** Edit-note save on the case page (Feature 12). */
export async function PATCH(request: Request, ctx: RouteContext<"/api/notes/[id]">) {
  const { id } = await ctx.params;

  let user;
  try {
    user = await getCurrentUser();
    await assertNoteOwner(id, user.id);
  } catch (error) {
    return errorResponse(error);
  }

  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: AUTH_ERRORS.generic }, { status: 400 });
  }

  const note = await withUser(user.id, (tx) =>
    tx.caseNote.update({ where: { id }, data: { content }, select: { id: true, content: true, createdAt: true } }),
  );

  return NextResponse.json(note);
}
