"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";

export interface NoteView {
  id: string;
  content: string;
  createdAt: string;
}

/**
 * Local state only — Feature 12 wires this to real caseNotes create/update.
 * Notes added here are not persisted and reset on refresh.
 */
export function NotesSection({ initialNotes }: { initialNotes: NoteView[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");

  function handleAdd() {
    const content = draft.trim();
    if (!content) return;
    setNotes((prev) => [{ id: crypto.randomUUID(), content, createdAt: new Date().toISOString() }, ...prev]);
    setDraft("");
  }

  return (
    <Card>
      <h2 className="font-black tracking-tight text-xl md:text-2xl">Notes</h2>

      <div className="flex flex-col gap-3 mt-3">
        {notes.length === 0 && <p className="font-mono text-sm text-black/60">No notes yet.</p>}
        {notes.map((note) => (
          <div key={note.id} className="border-2 border-black p-3">
            <p className="font-mono text-sm md:text-base whitespace-pre-wrap">{note.content}</p>
            <p className="font-mono text-xs text-black/50 mt-1">{formatDate(note.createdAt)}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 mt-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note…"
          rows={3}
          className="w-full rounded-none border-2 md:border-4 border-black font-mono text-sm md:text-base px-3 py-2 md:px-4 md:py-3 bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        />
        <Button size="sm" onClick={handleAdd} className="self-start">
          Save Note
        </Button>
      </div>
    </Card>
  );
}
