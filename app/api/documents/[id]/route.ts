import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertDocumentOwner } from "@/lib/auth/ownership";
import { withUser } from "@/lib/db/withUser";
import { AUTH_ERRORS } from "@/lib/auth/errors";
import { startProcessing } from "@/lib/documents/start-processing";

async function requireOwnedDocument(id: string) {
  const user = await getCurrentUser();
  await assertDocumentOwner(id, user.id);
  return user;
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : AUTH_ERRORS.generic;
  const status =
    message === AUTH_ERRORS.notFound ? 404 : message === AUTH_ERRORS.forbidden ? 403 : 401;
  return NextResponse.json({ error: message }, { status });
}

/** Polled by the upload page's processing state (Feature 09). */
export async function GET(_request: Request, ctx: RouteContext<"/api/documents/[id]">) {
  const { id } = await ctx.params;
  let user;
  try {
    user = await requireOwnedDocument(id);
  } catch (error) {
    return errorResponse(error);
  }

  const document = await withUser(user.id, (tx) =>
    tx.document.findUnique({
      where: { id },
      select: { processingStatus: true, pageCount: true, processingError: true, case: { select: { id: true } } },
    }),
  );
  if (!document) {
    return NextResponse.json({ error: AUTH_ERRORS.notFound }, { status: 404 });
  }

  return NextResponse.json({
    processingStatus: document.processingStatus,
    pageCount: document.pageCount,
    processingError: document.processingError,
    caseId: document.case?.id ?? null,
  });
}

/** Retry button on the failed state (Feature 09) — restarts the pipeline job. */
export async function POST(_request: Request, ctx: RouteContext<"/api/documents/[id]">) {
  const { id } = await ctx.params;
  let user;
  try {
    user = await requireOwnedDocument(id);
  } catch (error) {
    return errorResponse(error);
  }

  const processingStatus = await startProcessing(id, user.id);
  return NextResponse.json({ processingStatus });
}
