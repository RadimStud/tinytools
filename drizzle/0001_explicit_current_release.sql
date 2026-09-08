-- Explicit current release, version uniqueness, download metadata,
-- and a composite FK so current_version_id cannot point at another tool.

ALTER TABLE tools
  ADD COLUMN IF NOT EXISTS current_version_id uuid;

ALTER TABLE tool_versions
  ADD COLUMN IF NOT EXISTS original_file_name text;

ALTER TABLE tool_versions
  ADD COLUMN IF NOT EXISTS content_type text;

ALTER TABLE tool_versions
  ADD COLUMN IF NOT EXISTS file_size_bytes integer;

CREATE UNIQUE INDEX IF NOT EXISTS tool_versions_tool_id_version_unique
  ON tool_versions (tool_id, version);

CREATE UNIQUE INDEX IF NOT EXISTS tool_versions_id_tool_id_unique
  ON tool_versions (id, tool_id);

UPDATE tools AS t
SET current_version_id = (
  SELECT v.id
  FROM tool_versions AS v
  WHERE v.tool_id = t.id
    AND v.is_active = true
    AND v.file_key IS NOT NULL
    AND v.checksum IS NOT NULL
    AND v.checksum ~ '^[a-fA-F0-9]{64}$'
  ORDER BY v.created_at DESC
  LIMIT 1
)
WHERE t.current_version_id IS NULL
  AND t.status = 'published';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tools_current_version_id_tool_versions_id_fk'
  ) THEN
    ALTER TABLE tools
      ADD CONSTRAINT tools_current_version_id_tool_versions_id_fk
      FOREIGN KEY (current_version_id)
      REFERENCES tool_versions (id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tools_current_version_same_tool_fk'
  ) THEN
    ALTER TABLE tools
      ADD CONSTRAINT tools_current_version_same_tool_fk
      FOREIGN KEY (current_version_id, id)
      REFERENCES tool_versions (id, tool_id)
      ON DELETE RESTRICT;
  END IF;
END $$;
