import { generateObject, type ModelMessage } from "ai";
import { AiHelpResponseSchema, type AiHelpResponse } from "./schema";

/** Same full-tier model as lib/ai/analyze-document.ts — grounded Q&A needs the same reasoning quality. */
const AI_HELP_MODEL = "openai/gpt-6";

/** Retried once on invalid output, same as analyzeDocument. */
const MAX_ATTEMPTS = 2;

const SYSTEM_PROMPT = `You are bujhAI's AI Help assistant, answering questions about a specific document \
the person received, using the case facts and original document text provided below as context.

Rules:
- The document text is the primary source. Ground every answer in it and in the case facts — do \
not rely on outside knowledge about the issuer, program, or process beyond what's provided.
- Clearly separate what the document actually says from any general guidance you add. If you're \
not certain about something, say so explicitly rather than guessing.
- Cite the page number in parentheses, e.g. "(Page 3)", whenever you can identify the supporting page.
- Never invent a deadline, requirement, contact method, or consequence the document doesn't support.
- Do not give legal advice, medical diagnosis, or financial advice, and never suggest sending, \
submitting, or paying anything on the person's behalf — bujhAI never takes action for the user.
- You can: explain the document, answer questions about it, explain confusing sections, explain \
checklist items, and propose checklist items to add. Only propose a checklist item (in \
suggestedChecklistItems) when the person is asking to create/add tasks or it's clearly useful — \
leave it empty otherwise. Proposed items are never added automatically; the person must click Add.

--- CASE FACTS ---
{{FACTS}}

--- DOCUMENT TEXT ---
{{DOCUMENT}}`;

export interface AiHelpTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * Answers one question in an AI Help conversation, grounded in the case's
 * structured facts and original document text. `history` is the prior
 * conversation (oldest first); `question` is the newest user turn, not yet
 * included in `history`.
 */
export async function answerCaseQuestion(params: {
  factsText: string;
  documentText: string;
  history: AiHelpTurn[];
  question: string;
}): Promise<AiHelpResponse> {
  const system = SYSTEM_PROMPT.replace("{{FACTS}}", params.factsText).replace(
    "{{DOCUMENT}}",
    params.documentText,
  );
  const messages: ModelMessage[] = [
    ...params.history.map((m) => ({ role: m.role, content: m.content }) as ModelMessage),
    { role: "user", content: params.question },
  ];

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { object } = await generateObject({
        model: AI_HELP_MODEL,
        schema: AiHelpResponseSchema,
        system,
        messages,
      });
      return object;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("AI Help failed");
}
