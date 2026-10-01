-- get_draft_owner: same SECURITY DEFINER pattern as get_document_owner/get_case_owner
-- (direct userId column) — needed because PATCH /api/drafts/[id] is addressed by
-- draft id, not case id, and must distinguish "not found" from "forbidden" under RLS.
CREATE OR REPLACE FUNCTION get_draft_owner(draft_id text) RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT "userId" FROM "drafts" WHERE id = draft_id;
$$;
