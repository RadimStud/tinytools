# Releases

TinyTools stores an explicit current public release on the tool row.

## Representation

- Column: `tools.current_version_id`
- It is nullable.
- Draft tools may have no current release.
- Published tools must have a current release set by `DeveloperToolService.publishTool`.
- The composite SQL foreign key `tools_current_version_same_tool_fk` requires `(current_version_id, tools.id)` to match `(tool_versions.id, tool_versions.tool_id)`.
- A simpler FK also points `current_version_id` at `tool_versions.id` with `ON DELETE RESTRICT`.

Public pages and the download route never choose a version by `createdAt`. They join `tools.current_version_id`.

## Setting the release

1. First publish: the dashboard can send `versionId`, or the service picks the latest releasable uploaded version and writes `current_version_id`.
2. Later: owner uses `Set as current release` on an active version that has `fileKey` and a valid SHA-256 checksum.
3. Archived tools cannot change release, upload, edit, or publish.

## Releasable version

A version is releasable when all of these are true:

- `is_active = true`
- `file_key` is present
- `checksum` is a 64-character hex SHA-256
- it belongs to the same tool as `tools.id`
