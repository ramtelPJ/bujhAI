"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DraftType } from "@/lib/generated/prisma/enums";

interface DraftView {
  id: string;
  type: DraftType;
  content: string;
  createdAt: string;
}

const DRAFT_TYPE_OPTIONS: { value: DraftType; label: string }[] = [
  { value: "response", label: "Response" },
  { value: "email", label: "Email" },
  { value: "letter", label: "Letter" },
];

const DRAFT_FAILED_ERROR = "Something went wrong. Please try again.";

/** "Draft a Response" on the case page (Feature 14) — generates an editable, never-sent draft. */
export function DraftPanel({ caseId }: { caseId: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<DraftType>("response");
  const [instructions, setInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<DraftView | null>(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, type, instructions: instructions.trim() || undefined }),
      });
      if (!res.ok) throw new Error();
      const created: DraftView = await res.json();
      setDraft(created);
      setContent(created.content);
    } catch {
      setError(DRAFT_FAILED_ERROR);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/drafts/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
    } catch {
      setError(DRAFT_FAILED_ERROR);
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail (permissions, insecure context) — non-critical, ignore.
    }
  }

  function handleDraftAnother() {
    setDraft(null);
    setContent("");
    setSaved(false);
    setError(null);
  }

  return (
    <Card>
      <h2 className="font-black tracking-tight text-xl md:text-2xl">Next Step</h2>
      <p className="font-mono text-sm md:text-base mt-2 text-black/80">
        bujhAI can draft a response, email, or letter based on this case. You always review
        and send it yourself — bujhAI never sends anything for you.
      </p>

      {!open && !draft && (
        <Button className="mt-4" onClick={() => setOpen(true)}>
          Draft a Response
        </Button>
      )}

      {open && !draft && (
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex flex-wrap gap-2">
            {DRAFT_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value)}
                className={
                  option.value === type
                    ? "font-mono text-xs md:text-sm border-2 border-black px-3 py-1.5 bg-[#ccff00] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#00d9ff] focus-visible:ring-offset-2"
                    : "font-mono text-xs md:text-sm border-2 border-black px-3 py-1.5 bg-white hover:bg-[#ccff00] transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#00d9ff] focus-visible:ring-offset-2"
                }
              >
                {option.label}
              </button>
            ))}
          </div>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Optional instructions…"
            rows={2}
            className="w-full rounded-none border-2 border-black font-mono text-sm md:text-base px-3 py-2 bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleGenerate} disabled={generating}>
              {generating ? "Generating…" : "Generate"}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setOpen(false)} disabled={generating}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {draft && (
        <div className="flex flex-col gap-3 mt-4">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setSaved(false);
            }}
            rows={10}
            className="w-full rounded-none border-2 border-black font-mono text-sm md:text-base px-3 py-2 bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          />
          <p className="font-mono text-xs text-black/50">
            This is a draft only — bujhAI never sends it. Copy it and send it yourself.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleCopy}>
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button size="sm" variant="secondary" onClick={handleSave} disabled={saving || content.trim() === ""}>
              {saving ? "Saving…" : saved ? "Saved" : "Save"}
            </Button>
            <Button size="sm" variant="secondary" onClick={handleDraftAnother}>
              Draft Another
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-none border-2 border-black bg-[#ff006e] text-black font-mono text-xs md:text-sm px-3 py-2 md:px-4 md:py-3 mt-3">
          {error}
        </div>
      )}
    </Card>
  );
}
