BEGIN;

-- This permission is independent of the admin role. Only this account may hold it.
CREATE TABLE IF NOT EXISTS superuser_permissions (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT superuser_single_owner CHECK (user_id = '2e954c50-23d5-4e68-be4c-ff9a61a697ad'::uuid)
);
ALTER TABLE superuser_permissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = '2e954c50-23d5-4e68-be4c-ff9a61a697ad' AND auth_user_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Expected authenticated MiniKit owner was not found. Migration cancelled.';
  END IF;
END $$;

INSERT INTO superuser_permissions (user_id)
VALUES ('2e954c50-23d5-4e68-be4c-ff9a61a697ad')
ON CONFLICT (user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS vault_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name text NOT NULL,
  file_key text NOT NULL UNIQUE,
  size_bytes integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 262144000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'deleted')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vault_files_owner_created_idx ON vault_files(owner_id, created_at DESC);
ALTER TABLE vault_files ENABLE ROW LEVEL SECURITY;
-- No browser/Supabase policies: all operations use authenticated server routes.
COMMIT;
