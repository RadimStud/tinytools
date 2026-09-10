-- Internal admin role. Existing users stay 'user'.
-- Never grants admin automatically.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'user_role'
  ) THEN
    CREATE TYPE user_role AS ENUM (
      'user',
      'admin'
    );
  END IF;
END $$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role user_role;

UPDATE users
SET role = 'user'
WHERE role IS NULL;

ALTER TABLE users
  ALTER COLUMN role SET DEFAULT 'user';

ALTER TABLE users
  ALTER COLUMN role SET NOT NULL;
