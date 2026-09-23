-- Neon's default role (neondb_owner) has BYPASSRLS, so every RLS policy in
-- *_enable_rls is silently skipped when the app connects as that role. The
-- application must connect as a role WITHOUT BYPASSRLS for RLS to do anything.
-- This migration creates that role; its password is rotated immediately after
-- via `npm run db:rotate-app-role-password` (not stored in this file long-term).

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user WITH LOGIN PASSWORD 'bootstrap-rotate-me' NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
GRANT EXECUTE ON FUNCTION get_document_owner(text) TO app_user;
GRANT EXECUTE ON FUNCTION get_case_owner(text) TO app_user;
