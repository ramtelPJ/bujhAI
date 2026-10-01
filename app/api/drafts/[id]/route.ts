import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertDraftOwner } from "@/lib/auth/ownership";
import { withUser } from "@/lib/db/withUser";
import { AUTH_ERRORS } from "@/lib/auth/errors";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : AUTH_ERRORS.generic;
  const status =
    message === AUTH_ERRORS.notFound ? 404 : message === AUTH_ERRORS.forbidden ? 403 : 401;
  return NextResponse.json({ error: message }, { status });
}

/** Saves the user's edits to a generated draft (Feature 14). */
export async function PATCH(request: Request, ctx: RouteContext<"/api/drafts/[id]">) {
  const { id } = await ctx.params;

  let user;
  try {
    user = await getCurrentUser();
    await assertDraftOwner(id, user.id);
  } catch (error) {
    return errorResponse(error);
  }

  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: AUTH_ERRORS.generic }, { status: 400 });
  }

  const draft = await withUser(user.id, (tx) =>
    tx.draft.update({
      where: { id },
      data: { content },
      select: { id: true, type: true, content: true, createdAt: true },
    }),
  );

  return NextResponse.json(draft);
}
