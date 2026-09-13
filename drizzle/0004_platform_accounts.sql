-- P1: additive platform permissions. Apply transactionally with scripts/platform-db.mjs.
-- No implicit admin promotion and no changes to Market or Superuser data.
CREATE TABLE IF NOT EXISTS public.platform_apps (
  app_id text PRIMARY KEY CHECK (app_id ~ '^[a-z][a-z0-9-]{0,47}$'),
  name text NOT NULL,
  description text NOT NULL,
  state text NOT NULL CHECK (state IN ('available','coming_soon','unavailable')),
  internal_path text,
  access_mode text NOT NULL CHECK (access_mode IN ('explicit','public_free','authenticated_free')),
  contract_version text NOT NULL DEFAULT '1.0'
);
CREATE TABLE IF NOT EXISTS public.platform_admins (
  auth_user_id uuid PRIMARY KEY REFERENCES public.users(auth_user_id) ON DELETE RESTRICT,
  granted_at timestamptz NOT NULL DEFAULT now(),
  reason text NOT NULL CHECK (length(reason) BETWEEN 5 AND 500)
);
CREATE TABLE IF NOT EXISTS public.app_access (
  auth_user_id uuid NOT NULL REFERENCES public.users(auth_user_id) ON DELETE RESTRICT,
  app_id text NOT NULL REFERENCES public.platform_apps(app_id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('enabled','suspended','revoked')),
  app_role text NOT NULL CHECK (app_role IN ('user','app_admin')),
  policy_version integer NOT NULL CHECK (policy_version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid NOT NULL REFERENCES public.users(auth_user_id) ON DELETE RESTRICT,
  PRIMARY KEY (auth_user_id, app_id)
);
CREATE INDEX IF NOT EXISTS app_access_app_status_idx ON public.app_access(app_id, status);
CREATE TABLE IF NOT EXISTS public.admin_audit_events (
  request_id uuid PRIMARY KEY,
  actor_auth_user_id uuid NOT NULL REFERENCES public.users(auth_user_id) ON DELETE RESTRICT,
  target_auth_user_id uuid REFERENCES public.users(auth_user_id) ON DELETE RESTRICT,
  app_id text REFERENCES public.platform_apps(app_id) ON DELETE RESTRICT,
  action text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('success','denied','conflict')),
  reason text NOT NULL CHECK (length(reason) BETWEEN 5 AND 500),
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_events_created_idx ON public.admin_audit_events(created_at DESC);
ALTER TABLE public.platform_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_apps, public.platform_admins, public.app_access, public.admin_audit_events FROM PUBLIC;
DO $$
DECLARE client_role text;
BEGIN
  FOREACH client_role IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = client_role) THEN
      EXECUTE format('REVOKE ALL ON public.platform_apps, public.platform_admins, public.app_access, public.admin_audit_events FROM %I', client_role);
    END IF;
  END LOOP;
END $$;
INSERT INTO public.platform_apps (app_id,name,description,state,internal_path,access_mode)
VALUES
 ('market','MiniKit Market','Publish and manage focused software tools.','available','/dashboard','authenticated_free'),
 ('csv-cleaner','CSV Cleaner','Clean CSV files locally in your browser. No upload.','available','/workbench/csv-cleaner','public_free'),
 ('orion','ORION','AI assistants. Multi-user integration is not enabled yet.','coming_soon',NULL,'explicit')
ON CONFLICT (app_id) DO NOTHING;
