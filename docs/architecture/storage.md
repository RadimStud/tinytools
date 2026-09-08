# Storage

Binaries are stored in a private Cloudflare R2 bucket.

## Upload

1. Owner-authenticated Server Action `prepareVersionUpload` creates a short-lived presigned PUT URL.
2. The browser uploads directly to R2.
3. `finalizeVersionUpload` stores `fileKey`, SHA-256 checksum, original filename, content type, and file size.
4. When possible, the server reads size and content type with `HeadObject` after upload.

R2 access keys stay on the server. They are not sent to the client.

## Download

`createDownloadUrl` signs a GET with:

- `ResponseContentDisposition: attachment` and a sanitized filename
- `ResponseContentType` from stored metadata, or `application/octet-stream`

Public downloads go through `/tools/[slug]/download`, which:

- loads only a published tool
- uses `tools.current_version_id`
- allows free tools only
- redirects to a short-lived presigned URL

Legacy rows without filename metadata fall back to the last `fileKey` path segment.
