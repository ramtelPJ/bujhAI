import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertCaseOwner } from "@/lib/auth/ownership";
import { withUser } from "@/lib/db/withUser";
import { AUTH_ERRORS } from "@/lib/auth/errors";
import { trackServerEvent } from "@/lib/analytics/server-events";
import { loadCaseContext } from "@/lib/ai/case-context";
import { answerCaseQuestion, type AiHelpTurn } from "@/lib/ai/ai-help";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : AUTH_ERRORS.generic;
  const status =
    message === AUTH_ERRORS.notFound ? 404 : message === AUTH_ERRORS.forbidden ? 403 : 401;
  return NextResponse.json({ error: message }, { status });
}

/** Finds the case's existing conversation for this user, or starts one — build-plan.md: "create or reuse the conversation for the case". */
async function findOrCreateConversation(caseId: string, userId: string) {
  return withUser(userId, async (tx) => {
    const existing = await tx.conversation.findFirst({ where: { caseId, userId } });
    if (existing) return existing;
    return tx.conversation.create({ data: { caseId, userId } });
  });
}

/** AI Help panel (Feature 13) — ask a question, get a grounded answer plus optional suggested checklist items. */
export async function POST(request: Request) {
  let user;
  try {
    user = await getCurrentUser();
  } catch (error) {
    return errorResponse(error);
  }

  const body = await request.json().catch(() => null);
  const caseId = typeof body?.caseId === "string" ? body.caseId : "";
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!caseId || !question) {
    return NextResponse.json({ error: AUTH_ERRORS.generic }, { status: 400 });
  }

  try {
    await assertCaseOwner(caseId, user.id);
  } catch (error) {
    return errorResponse(error);
  }

  const conversation = await findOrCreateConversation(caseId, user.id);

  const priorMessages = await withUser(user.id, (tx) =>
    tx.message.findMany({ where: { conversationId: conversation.id }, orderBy: { createdAt: "asc" } }),
  );
  const history: AiHelpTurn[] = priorMessages.map((m) => ({ role: m.role, content: m.content }));

  const userMessage = await withUser(user.id, (tx) =>
    tx.message.create({ data: { conversationId: conversation.id, role: "user", content: question } }),
  );

  let response;
  try {
    const context = await loadCaseContext(caseId, user.id);
    response = await answerCaseQuestion({ ...context, history, question });
  } catch {
    return NextResponse.json({ error: AUTH_ERRORS.generic }, { status: 502 });
  }

  const assistantMessage = await withUser(user.id, (tx) =>
    tx.message.create({ data: { conversationId: conversation.id, role: "assistant", content: response.answer } }),
  );

  trackServerEvent("assistant_question_asked", { userId: user.id, caseId });

  return NextResponse.json({
    conversationId: conversation.id,
    userMessage: { id: userMessage.id, role: userMessage.role, content: userMessage.content, createdAt: userMessage.createdAt },
    assistantMessage: {
      id: assistantMessage.id,
      role: assistantMessage.role,
      content: assistantMessage.content,
      createdAt: assistantMessage.createdAt,
    },
    suggestedChecklistItems: response.suggestedChecklistItems,
  });
}
