-- Row-Level Security: default deny on every user-owned table.
-- The app sets `app.current_user_id` per-request (see lib/db/withUser.ts) via
-- set_config(..., true), scoped to the transaction. FORCE ROW LEVEL SECURITY
-- is required because Neon's default role owns these tables, and RLS is
-- otherwise bypassed for the owning role.

-- Direct ownership: userId column
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents" FORCE ROW LEVEL SECURITY;
CREATE POLICY documents_select ON "documents" FOR SELECT USING ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY documents_insert ON "documents" FOR INSERT WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY documents_update ON "documents" FOR UPDATE USING ("userId" = current_setting('app.current_user_id', true)) WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY documents_delete ON "documents" FOR DELETE USING ("userId" = current_setting('app.current_user_id', true));

ALTER TABLE "cases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cases" FORCE ROW LEVEL SECURITY;
CREATE POLICY cases_select ON "cases" FOR SELECT USING ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY cases_insert ON "cases" FOR INSERT WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY cases_update ON "cases" FOR UPDATE USING ("userId" = current_setting('app.current_user_id', true)) WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY cases_delete ON "cases" FOR DELETE USING ("userId" = current_setting('app.current_user_id', true));

ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "conversations" FORCE ROW LEVEL SECURITY;
CREATE POLICY conversations_select ON "conversations" FOR SELECT USING ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY conversations_insert ON "conversations" FOR INSERT WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY conversations_update ON "conversations" FOR UPDATE USING ("userId" = current_setting('app.current_user_id', true)) WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY conversations_delete ON "conversations" FOR DELETE USING ("userId" = current_setting('app.current_user_id', true));

ALTER TABLE "drafts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "drafts" FORCE ROW LEVEL SECURITY;
CREATE POLICY drafts_select ON "drafts" FOR SELECT USING ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY drafts_insert ON "drafts" FOR INSERT WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY drafts_update ON "drafts" FOR UPDATE USING ("userId" = current_setting('app.current_user_id', true)) WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY drafts_delete ON "drafts" FOR DELETE USING ("userId" = current_setting('app.current_user_id', true));

ALTER TABLE "case_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "case_notes" FORCE ROW LEVEL SECURITY;
CREATE POLICY case_notes_select ON "case_notes" FOR SELECT USING ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY case_notes_insert ON "case_notes" FOR INSERT WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY case_notes_update ON "case_notes" FOR UPDATE USING ("userId" = current_setting('app.current_user_id', true)) WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY case_notes_delete ON "case_notes" FOR DELETE USING ("userId" = current_setting('app.current_user_id', true));

-- Child records: ownership via parent case's userId
ALTER TABLE "extractions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "extractions" FORCE ROW LEVEL SECURITY;
CREATE POLICY extractions_select ON "extractions" FOR SELECT USING (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "extractions"."caseId" AND c."userId" = current_setting('app.current_user_id', true)));
CREATE POLICY extractions_insert ON "extractions" FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "extractions"."caseId" AND c."userId" = current_setting('app.current_user_id', true)));
CREATE POLICY extractions_update ON "extractions" FOR UPDATE USING (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "extractions"."caseId" AND c."userId" = current_setting('app.current_user_id', true))) WITH CHECK (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "extractions"."caseId" AND c."userId" = current_setting('app.current_user_id', true)));
CREATE POLICY extractions_delete ON "extractions" FOR DELETE USING (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "extractions"."caseId" AND c."userId" = current_setting('app.current_user_id', true)));

ALTER TABLE "deadlines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deadlines" FORCE ROW LEVEL SECURITY;
CREATE POLICY deadlines_select ON "deadlines" FOR SELECT USING (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "deadlines"."caseId" AND c."userId" = current_setting('app.current_user_id', true)));
CREATE POLICY deadlines_insert ON "deadlines" FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "deadlines"."caseId" AND c."userId" = current_setting('app.current_user_id', true)));
CREATE POLICY deadlines_update ON "deadlines" FOR UPDATE USING (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "deadlines"."caseId" AND c."userId" = current_setting('app.current_user_id', true))) WITH CHECK (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "deadlines"."caseId" AND c."userId" = current_setting('app.current_user_id', true)));
CREATE POLICY deadlines_delete ON "deadlines" FOR DELETE USING (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "deadlines"."caseId" AND c."userId" = current_setting('app.current_user_id', true)));

ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" FORCE ROW LEVEL SECURITY;
CREATE POLICY tasks_select ON "tasks" FOR SELECT USING (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "tasks"."caseId" AND c."userId" = current_setting('app.current_user_id', true)));
CREATE POLICY tasks_insert ON "tasks" FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "tasks"."caseId" AND c."userId" = current_setting('app.current_user_id', true)));
CREATE POLICY tasks_update ON "tasks" FOR UPDATE USING (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "tasks"."caseId" AND c."userId" = current_setting('app.current_user_id', true))) WITH CHECK (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "tasks"."caseId" AND c."userId" = current_setting('app.current_user_id', true)));
CREATE POLICY tasks_delete ON "tasks" FOR DELETE USING (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "tasks"."caseId" AND c."userId" = current_setting('app.current_user_id', true)));

ALTER TABLE "required_materials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "required_materials" FORCE ROW LEVEL SECURITY;
CREATE POLICY required_materials_select ON "required_materials" FOR SELECT USING (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "required_materials"."caseId" AND c."userId" = current_setting('app.current_user_id', true)));
CREATE POLICY required_materials_insert ON "required_materials" FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "required_materials"."caseId" AND c."userId" = current_setting('app.current_user_id', true)));
CREATE POLICY required_materials_update ON "required_materials" FOR UPDATE USING (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "required_materials"."caseId" AND c."userId" = current_setting('app.current_user_id', true))) WITH CHECK (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "required_materials"."caseId" AND c."userId" = current_setting('app.current_user_id', true)));
CREATE POLICY required_materials_delete ON "required_materials" FOR DELETE USING (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "required_materials"."caseId" AND c."userId" = current_setting('app.current_user_id', true)));

ALTER TABLE "submission_methods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "submission_methods" FORCE ROW LEVEL SECURITY;
CREATE POLICY submission_methods_select ON "submission_methods" FOR SELECT USING (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "submission_methods"."caseId" AND c."userId" = current_setting('app.current_user_id', true)));
CREATE POLICY submission_methods_insert ON "submission_methods" FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "submission_methods"."caseId" AND c."userId" = current_setting('app.current_user_id', true)));
CREATE POLICY submission_methods_update ON "submission_methods" FOR UPDATE USING (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "submission_methods"."caseId" AND c."userId" = current_setting('app.current_user_id', true))) WITH CHECK (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "submission_methods"."caseId" AND c."userId" = current_setting('app.current_user_id', true)));
CREATE POLICY submission_methods_delete ON "submission_methods" FOR DELETE USING (EXISTS (SELECT 1 FROM "cases" c WHERE c.id = "submission_methods"."caseId" AND c."userId" = current_setting('app.current_user_id', true)));

-- Child records: ownership via parent conversation's userId (which is the case owner)
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "messages" FORCE ROW LEVEL SECURITY;
CREATE POLICY messages_select ON "messages" FOR SELECT USING (EXISTS (SELECT 1 FROM "conversations" conv WHERE conv.id = "messages"."conversationId" AND conv."userId" = current_setting('app.current_user_id', true)));
CREATE POLICY messages_insert ON "messages" FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM "conversations" conv WHERE conv.id = "messages"."conversationId" AND conv."userId" = current_setting('app.current_user_id', true)));
CREATE POLICY messages_update ON "messages" FOR UPDATE USING (EXISTS (SELECT 1 FROM "conversations" conv WHERE conv.id = "messages"."conversationId" AND conv."userId" = current_setting('app.current_user_id', true))) WITH CHECK (EXISTS (SELECT 1 FROM "conversations" conv WHERE conv.id = "messages"."conversationId" AND conv."userId" = current_setting('app.current_user_id', true)));
CREATE POLICY messages_delete ON "messages" FOR DELETE USING (EXISTS (SELECT 1 FROM "conversations" conv WHERE conv.id = "messages"."conversationId" AND conv."userId" = current_setting('app.current_user_id', true)));
