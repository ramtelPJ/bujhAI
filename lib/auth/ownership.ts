import { prisma } from "@/lib/db/client";
import { AUTH_ERRORS } from "./errors";

/**
 * Ownership checks used by every route before touching case/document data.
 * Looks up the true owner via a SECURITY DEFINER function (see
 * prisma/migrations/*_ownership_lookup_functions) so a missing row and a
 * row owned by someone else get the distinct §4 messages, even though RLS
 * would otherwise make both cases look identical (no row visible).
 */

export async function assertDocumentOwner(documentId: string, userId: string): Promise<void> {
  const [row] = await prisma.$queryRaw<{ get_document_owner: string | null }[]>`
    SELECT get_document_owner(${documentId})
  `;
  const ownerId = row?.get_document_owner ?? null;
  if (ownerId === null) throw new Error(AUTH_ERRORS.notFound);
  if (ownerId !== userId) throw new Error(AUTH_ERRORS.forbidden);
}

export async function assertCaseOwner(caseId: string, userId: string): Promise<void> {
  const [row] = await prisma.$queryRaw<{ get_case_owner: string | null }[]>`
    SELECT get_case_owner(${caseId})
  `;
  const ownerId = row?.get_case_owner ?? null;
  if (ownerId === null) throw new Error(AUTH_ERRORS.notFound);
  if (ownerId !== userId) throw new Error(AUTH_ERRORS.forbidden);
}

/** Tasks have no direct userId — owner is the parent case's userId (see get_task_owner). */
export async function assertTaskOwner(taskId: string, userId: string): Promise<void> {
  const [row] = await prisma.$queryRaw<{ get_task_owner: string | null }[]>`
    SELECT get_task_owner(${taskId})
  `;
  const ownerId = row?.get_task_owner ?? null;
  if (ownerId === null) throw new Error(AUTH_ERRORS.notFound);
  if (ownerId !== userId) throw new Error(AUTH_ERRORS.forbidden);
}

export async function assertNoteOwner(noteId: string, userId: string): Promise<void> {
  const [row] = await prisma.$queryRaw<{ get_note_owner: string | null }[]>`
    SELECT get_note_owner(${noteId})
  `;
  const ownerId = row?.get_note_owner ?? null;
  if (ownerId === null) throw new Error(AUTH_ERRORS.notFound);
  if (ownerId !== userId) throw new Error(AUTH_ERRORS.forbidden);
}

export async function assertDraftOwner(draftId: string, userId: string): Promise<void> {
  const [row] = await prisma.$queryRaw<{ get_draft_owner: string | null }[]>`
    SELECT get_draft_owner(${draftId})
  `;
  const ownerId = row?.get_draft_owner ?? null;
  if (ownerId === null) throw new Error(AUTH_ERRORS.notFound);
  if (ownerId !== userId) throw new Error(AUTH_ERRORS.forbidden);
}
