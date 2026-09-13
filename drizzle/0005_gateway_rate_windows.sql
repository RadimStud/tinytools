-- P2 operational rate guard. No new identity, grants, paid usage or ORION enablement.
CREATE TABLE IF NOT EXISTS public.gateway_rate_windows (
  auth_user_id uuid NOT NULL REFERENCES public.users(auth_user_id) ON DELETE CASCADE,
  minute timestamptz NOT NULL,
  hits integer NOT NULL CHECK (hits BETWEEN 1 AND 60),
  PRIMARY KEY (auth_user_id, minute)
);
CREATE INDEX IF NOT EXISTS gateway_rate_windows_expiry ON public.gateway_rate_windows(minute);
ALTER TABLE public.gateway_rate_windows ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gateway_rate_windows FROM PUBLIC;
DO $$ DECLARE r text; BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON public.gateway_rate_windows FROM %I', r);
    END IF;
  END LOOP;
END $$;
