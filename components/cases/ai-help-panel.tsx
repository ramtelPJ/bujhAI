"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SuggestedTaskItem } from "@/lib/ai/schema";
import type { MessageRole } from "@/lib/generated/prisma/enums";

export interface MessageView {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

interface ChatMessage extends MessageView {
  suggestedChecklistItems?: SuggestedTaskItem[];
}

const EXAMPLE_QUESTIONS = [
  "What is this?",
  "Do I need to do anything?",
  "When is this due?",
  "What do I need to send?",
  "Where do I send it?",
  "What happens if I do nothing?",
  "Explain page 3",
];

const ASK_FAILED_ERROR = "Something went wrong. Please try again.";

interface AiHelpPanelProps {
  caseId: string;
  initialMessages: MessageView[];
  /** Persists a suggested item as a real Task; returns whether it succeeded. */
  onAddTask: (item: SuggestedTaskItem) => Promise<boolean>;
}

export function AiHelpPanel({ caseId, initialMessages, onAddTask }: AiHelpPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedKeys, setAddedKeys] = useState<Set<string>>(new Set());

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || asking) return;
    setInput("");
    setAsking(true);
    setError(null);
    setMessages((prev) => [
      ...prev,
      { id: `pending-${Date.now()}`, role: "user", content: trimmed, createdAt: new Date().toISOString() },
    ]);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, question: trimmed }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages((prev) => [
        // Replace the optimistic user message with the persisted one, then append the answer.
        ...prev.slice(0, -1),
        data.userMessage,
        { ...data.assistantMessage, suggestedChecklistItems: data.suggestedChecklistItems ?? [] },
      ]);
    } catch {
      setError(ASK_FAILED_ERROR);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setAsking(false);
    }
  }

  async function handleAdd(messageId: string, index: number, item: SuggestedTaskItem) {
    const key = `${messageId}-${index}`;
    const ok = await onAddTask(item);
    if (ok) setAddedKeys((prev) => new Set(prev).add(key));
  }

  return (
    <Card>
      <h2 className="font-black tracking-tight text-xl md:text-2xl">AI Help</h2>
      <p className="font-mono text-sm md:text-base mt-2 text-black/80">
        Ask a question about this document. Answers are grounded in the document itself —
        bujhAI never gives legal, medical, or financial advice.
      </p>

      {messages.length > 0 && (
        <div className="flex flex-col gap-3 mt-4">
          {messages.map((message) => (
            <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  message.role === "user"
                    ? "max-w-[85%] border-2 border-black bg-black text-white font-mono text-sm px-3 py-2"
                    : "max-w-[85%] border-2 border-black bg-white text-black font-mono text-sm px-3 py-2"
                }
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.suggestedChecklistItems && message.suggestedChecklistItems.length > 0 && (
                  <div className="flex flex-col gap-2 mt-3 border-t-2 border-black/10 pt-2">
                    {message.suggestedChecklistItems.map((item, index) => {
                      const key = `${message.id}-${index}`;
                      const added = addedKeys.has(key);
                      return (
                        <div key={key} className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs md:text-sm">{item.title}</span>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={added}
                            onClick={() => handleAdd(message.id, index, item)}
                          >
                            {added ? "Added" : "Add to checklist"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {asking && <p className="font-mono text-sm text-black/60 mt-3">Thinking…</p>}

      {error && (
        <div className="rounded-none border-2 border-black bg-[#ff006e] text-white font-mono text-xs md:text-sm px-3 py-2 md:px-4 md:py-3 mt-3">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        {EXAMPLE_QUESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            disabled={asking}
            onClick={() => ask(question)}
            className="font-mono text-xs md:text-sm border-2 border-black px-3 py-1.5 bg-white hover:bg-[#ccff00] transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none"
          >
            {question}
          </button>
        ))}
      </div>

      <form
        className="flex gap-2 mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <Input
          placeholder="Ask a question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={asking}
        />
        <Button size="sm" type="submit" disabled={asking || !input.trim()}>
          Ask
        </Button>
      </form>
    </Card>
  );
}
