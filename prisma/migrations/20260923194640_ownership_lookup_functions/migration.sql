-- Narrow SECURITY DEFINER lookups so ownership checks (lib/auth/ownership.ts) can
-- distinguish "doesn't exist" from "exists but isn't yours" (different user-facing
-- messages per authentiation-security.md §4) without a blanket RLS bypass. Each
-- function reveals only the owning userId of a row, never any other column.

CREATE OR REPLACE FUNCTION get_document_owner(doc_id text) RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT "userId" FROM "documents" WHERE id = doc_id;
$$;

CREATE OR REPLACE FUNCTION get_case_owner(target_case_id text) RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT "userId" FROM "cases" WHERE id = target_case_id;
$$;
