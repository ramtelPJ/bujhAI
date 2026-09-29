import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertTaskOwner } from "@/lib/auth/ownership";
import { withUser } from "@/lib/db/withUser";
import { AUTH_ERRORS } from "@/lib/auth/errors";
import { trackServerEvent } from "@/lib/analytics/server-events";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : AUTH_ERRORS.generic;
  const status =
    message === AUTH_ERRORS.notFound ? 404 : message === AUTH_ERRORS.forbidden ? 403 : 401;
  return NextResponse.json({ error: message }, { status });
}

/** Checklist toggle on the case page (Feature 12) — only `completed` is client-controlled. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/tasks/[id]">) {
  const { id } = await ctx.params;

  let user;
  try {
    user = await getCurrentUser();
    await assertTaskOwner(id, user.id);
  } catch (error) {
    return errorResponse(error);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.completed !== "boolean") {
    return NextResponse.json({ error: AUTH_ERRORS.generic }, { status: 400 });
  }

  const task = await withUser(user.id, (tx) =>
    tx.task.update({
      where: { id },
      data: {
        status: body.completed ? "completed" : "pending",
        completedAt: body.completed ? new Date() : null,
      },
      select: { id: true, caseId: true, status: true, completedAt: true },
    }),
  );

  if (body.completed) {
    trackServerEvent("task_completed", { userId: user.id, caseId: task.caseId, taskId: task.id });
  }

  return NextResponse.json({ id: task.id, completed: task.status === "completed" });
}
