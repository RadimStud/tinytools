-- ONLY for the guarded minikit_platform_test database. All identifiers are synthetic.
DO $$ BEGIN CREATE TYPE public.user_role AS ENUM ('user','admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), auth_user_id uuid UNIQUE,
  display_name text NOT NULL, role public.user_role NOT NULL DEFAULT 'user', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.tools (id uuid PRIMARY KEY, owner_id uuid REFERENCES public.users(id), name text NOT NULL);
CREATE TABLE IF NOT EXISTS public.superuser_permissions (user_id uuid PRIMARY KEY REFERENCES public.users(id));
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
END $$;
INSERT INTO public.users (id,auth_user_id,display_name,role) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Platform operator','user'),
 ('11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','Account A','user'),
 ('22222222-2222-4222-8222-222222222222','22222222-2222-4222-8222-222222222222','Account B','user'),
 ('33333333-3333-4333-8333-333333333333','33333333-3333-4333-8333-333333333333','Market administrator','admin')
ON CONFLICT DO NOTHING;
INSERT INTO public.tools VALUES ('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','Existing tool sentinel') ON CONFLICT DO NOTHING;
INSERT INTO public.superuser_permissions VALUES ('11111111-1111-4111-8111-111111111111') ON CONFLICT DO NOTHING;
