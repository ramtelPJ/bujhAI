-- Feature 12: PATCH /api/tasks/[id] and note routes take a task/note id, not a
-- caseId, so they need their own SECURITY DEFINER lookups (same reasoning as
-- 20260923194640_ownership_lookup_functions) to distinguish "doesn't exist"
-- from "exists but isn't yours". Tasks have no direct userId, so this joins
-- through the parent case.

CREATE OR REPLACE FUNCTION get_task_owner(task_id text) RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT c."userId" FROM "tasks" t JOIN "cases" c ON c.id = t."caseId" WHERE t.id = task_id;
$$;

CREATE OR REPLACE FUNCTION get_note_owner(note_id text) RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT "userId" FROM "case_notes" WHERE id = note_id;
$$;
