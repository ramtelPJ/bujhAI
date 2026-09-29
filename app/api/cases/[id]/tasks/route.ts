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

function toDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "Add to checklist" on an AI Help suggestion (Feature 13) — the only way a suggested item becomes a real Task. */
export async function POST(request: Request, ctx: RouteContext<"/api/cases/[id]/tasks">) {
  const { id: caseId } = await ctx.params;

  let user;
  try {
    user = await getCurrentUser();
    await assertCaseOwner(caseId, user.id);
  } catch (error) {
    return errorResponse(error);
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: AUTH_ERRORS.generic }, { status: 400 });
  }

  const task = await withUser(user.id, (tx) =>
    tx.task.create({
      data: {
        caseId,
        title,
        description: typeof body?.description === "string" ? body.description : "",
        required: Boolean(body?.required),
        dueDate: toDate(body?.dueDate),
        sourcePage: typeof body?.sourcePage === "number" ? body.sourcePage : null,
      },
    }),
  );

  return NextResponse.json({
    id: task.id,
    title: task.title,
    description: task.description || undefined,
    required: task.required,
    completed: false,
    sourcePage: task.sourcePage ?? undefined,
  });
}
