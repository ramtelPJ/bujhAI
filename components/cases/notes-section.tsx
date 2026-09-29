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

const SAVE_FAILED_ERROR = "Something went wrong. Please try again.";

/** Feature 12 — real caseNotes create/update via POST/PATCH, owned by the current user. */
export function NotesSection({ caseId, initialNotes }: { caseId: string; initialNotes: NoteView[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  async function handleAdd() {
    const content = draft.trim();
    if (!content) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error();
      const note: NoteView = await res.json();
      setNotes((prev) => [note, ...prev]);
      setDraft("");
    } catch {
      setError(SAVE_FAILED_ERROR);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(note: NoteView) {
    setEditingId(note.id);
    setEditDraft(note.content);
    setError(null);
  }

  async function handleSaveEdit(id: string) {
    const content = editDraft.trim();
    if (!content) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error();
      const updated: NoteView = await res.json();
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      setEditingId(null);
    } catch {
      setError(SAVE_FAILED_ERROR);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2 className="font-black tracking-tight text-xl md:text-2xl">Notes</h2>

      <div className="flex flex-col gap-3 mt-3">
        {notes.length === 0 && <p className="font-mono text-sm text-black/60">No notes yet.</p>}
        {notes.map((note) =>
          editingId === note.id ? (
            <div key={note.id} className="border-2 border-black p-3 flex flex-col gap-2">
              <textarea
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                rows={3}
                className="w-full rounded-none border-2 border-black font-mono text-sm md:text-base px-3 py-2 bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleSaveEdit(note.id)} disabled={saving}>
                  Save
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div key={note.id} className="border-2 border-black p-3">
              <p className="font-mono text-sm md:text-base whitespace-pre-wrap">{note.content}</p>
              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="font-mono text-xs text-black/50">{formatDate(note.createdAt)}</p>
                <button
                  type="button"
                  onClick={() => startEdit(note)}
                  className="font-mono text-xs uppercase tracking-wider hover:underline"
                >
                  Edit
                </button>
              </div>
            </div>
          ),
        )}
      </div>

      {error && (
        <div className="rounded-none border-2 border-black bg-[#ff006e] text-white font-mono text-xs md:text-sm px-3 py-2 md:px-4 md:py-3 mt-3">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2 mt-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note…"
          rows={3}
          className="w-full rounded-none border-2 md:border-4 border-black font-mono text-sm md:text-base px-3 py-2 md:px-4 md:py-3 bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        />
        <Button size="sm" onClick={handleAdd} disabled={saving} className="self-start">
          Save Note
        </Button>
      </div>
    </Card>
  );
}
