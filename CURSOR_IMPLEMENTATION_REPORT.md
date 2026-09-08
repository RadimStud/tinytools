# TinyTools Cursor Implementation Report

## 1. Executive summary

TinyTools now has an explicit current public release (`tools.current_version_id`), version uniqueness in PostgreSQL, binary download metadata, attachment-style presigned downloads, owner-guarded release switching in the dashboard, public catalog/search limited to published tools, consistent `ToolError` handling for developer/public flows, Vitest coverage for the critical services, and GitHub Actions CI.

Public detail and public download no longer pick a version by `createdAt`. They use the stored current release only.

## 2. Starting state

Before this work the marketplace MVP already had:

- Next.js 16, TypeScript, Tailwind, Drizzle, Supabase Auth, private R2
- Developer draft → version → upload → SHA-256 → publish → public listing
- Public tool model with `description` and `release`
- Public download route that joined versions and ordered by `createdAt`
- Service-layer duplicate version check without a DB unique constraint
- No Vitest, no CI workflow, no explicit current release column

`npm run lint` and `npm run build` were already passing.

## 3. Architecture

Unchanged layering:

```
app / server actions / routes
  → services
    → repository interfaces (domain)
      → infrastructure (Postgres, R2, Supabase)
```

Changed areas:

- Domain: tool release, version rules, `ToolError`
- Repositories: public catalog/download, developer publish/release/file metadata
- Services: `DeveloperToolService`, `ToolService`
- App: dashboard tool page, public product page, catalog cards, download route
- Infra: Drizzle schema, R2 signing, SQL migration
- Tests and CI

UI still does not query PostgreSQL, R2, or Stripe directly except through services (download route uses `ToolService`, then R2 helper).

## 4. Database changes

### Schema (`src/infrastructure/db/schema.ts`)

| Change | Why |
| --- | --- |
| `tools.current_version_id` uuid, nullable, FK to `tool_versions.id` `ON DELETE RESTRICT` | Explicit current release. Restrict prevents deleting the version row that a tool currently points at. |
| `tool_versions.original_file_name` | Store the uploader filename for Content-Disposition. |
| `tool_versions.content_type` | Store MIME for download response override. |
| `tool_versions.file_size_bytes` | Show size on the public page; optional for old rows. |
| Unique index `tool_versions_tool_id_version_unique` on `(tool_id, version)` | Close the duplicate-version race. |
| Unique index `tool_versions_id_tool_id_unique` on `(id, tool_id)` | Enables the composite same-tool FK. |

Existing constraints kept:

- `tools.slug` unique
- `tool_platforms (tool_id, platform)` unique
- `tools.owner_id` → `users.id` `ON DELETE SET NULL` (keep tools if a user row is removed)
- `tool_platforms.tool_id` and `tool_versions.tool_id` → `tools.id` `ON DELETE CASCADE` (versions/platforms are owned by the tool)
- `tool_requests.requested_by` `ON DELETE SET NULL`
- Status enum: `draft | published | archived`
- Platform enum: `windows | macos | linux`

Circular FK typing uses `AnyPgColumn` so `tools.current_version_id` can reference `tool_versions.id` while versions still reference `tools.id`.

### Migration

File: `drizzle/0001_explicit_current_release.sql`

- Adds the new columns if missing
- Creates both unique indexes
- Backfills `current_version_id` for **published** tools that have a releasable version (active + file_key + SHA-256-looking checksum), using latest `created_at` **only as a one-time backfill**
- Adds `tools_current_version_id_tool_versions_id_fk` if missing
- Adds composite `tools_current_version_same_tool_fk` `(current_version_id, id) → (tool_versions.id, tool_id)` `ON DELETE RESTRICT`

Why composite FK: a simple FK cannot stop `current_version_id` pointing at another tool’s version. PostgreSQL `MATCH SIMPLE` still allows `current_version_id` NULL.

The SQL is idempotent (`IF NOT EXISTS` / constraint name checks).

Apply:

```bash
psql "$DATABASE_URL" -f drizzle/0001_explicit_current_release.sql
```

`npm run db:push` syncs columns/indexes from Drizzle. Still run the SQL file so the composite FK exists.

### Iteration order note

Iterations 1, 3, and 4 share `tools` / `tool_versions`. They were implemented as **one schema + one SQL migration**, then application code. Splitting three live generate/push cycles against the same tables would have been riskier and harder to backfill once.

## 5. Current release design

### Representation

Stored on `tools.current_version_id`, not on `tool_versions.is_current_release`.

One tool can have at most one current release because it is a single column.

### How it is set

- **First publish:** dashboard select `versionId`, or omit it. Service uses that version or `latestReleasableVersion()` (createdAt only as a candidate picker **before** persist). `publishForOwner` writes `status = published` **and** `current_version_id`.
- **Later:** `DeveloperToolService.setCurrentRelease` after owner/version/releasable checks. Repository updates only `current_version_id`.
- Draft tools may have `current_version_id` null, or set a candidate via “Set as current release”.
- Published tools must have a current release after a successful publish.
- Archived tools cannot set a release.

### Validation (service)

Must belong to the owned tool (`findByIdForOwner` + version id in `tool.versions`).

Must be active, have `fileKey`, have a 64-hex SHA-256 checksum.

Wrong tool id from the browser fails owner lookup (`Tool not found`) or version membership (`Selected release does not belong to this tool.`).

DB composite FK is the last line of defense.

### Public page

`PostgresToolRepository.findBySlug` / `findAll` / `search` left-join `tool_versions` on `tools.current_version_id`. Status filter is `published` only.

### Download route

`ToolService.getPublicDownload(slug)` → `findPublicDownloadBySlug`:

- `status = published`
- inner join current version
- version `tool_id` must equal tool id
- version active with `fileKey` and checksum
- `priceCents > 0` → `Paid downloads are not available yet.` (HTTP 403)
- otherwise missing/invalid → 404

Then `createDownloadUrl` with attachment disposition.

### Publish vs switch

Publish: draft → published + currentVersionId.

Switch: published (or draft) owner updates currentVersionId; `revalidatePath` for `/`, `/search`, `/tools/[slug]`, `/tools/[slug]/download`, dashboard.

After publish, public code never orders by `createdAt`.

## 6. Domain model changes

| Type / module | Change |
| --- | --- |
| `ToolRelease` | `originalFileName`, `fileSizeBytes` added |
| `Tool` | unchanged aside from richer `release` |
| `PublicToolDownload` | new; server-only download payload including `fileKey` |
| `DeveloperToolDetail` | `currentVersionId` |
| `DeveloperToolVersion` | `originalFileName`, `contentType`, `fileSizeBytes` |
| `PublishDeveloperToolInput` | `currentVersionId` required |
| `SetCurrentReleaseInput` | new |
| `AttachDeveloperToolVersionFileInput` | metadata fields |
| `ToolError` | typed business errors |
| `version-rules.ts` | semver, SHA-256, releasable, filename helpers |

## 7. Repository changes

### `ToolRepository`

- `findAll`, `findBySlug`, `search` — published only; search also matches `description`
- `findPublicDownloadBySlug` — current release join, not createdAt

Implementations: `PostgresToolRepository`, `InMemoryToolRepository`

### `DeveloperToolRepository`

- `publishForOwner({ toolId, ownerId, currentVersionId })` — only `status = draft`
- `setCurrentReleaseForOwner`
- `attachFileToVersionForOwner` stores metadata
- `createVersionForOwner` maps unique violations to `Version already exists.`

Implementations: `PostgresDeveloperToolRepository`, `InMemoryDeveloperToolRepository` (tests)

All owner methods filter `tools.owner_id = ownerId`.

## 8. Service changes

### `DeveloperToolService`

- Archived: no update, create version, attach binary, publish, or set release
- Only drafts can be initially published
- Duplicate version / invalid semver / missing binary / invalid checksum
- Publish writes explicit `currentVersionId`
- Set release rejects other-tool version ids
- `archiveTool` returns slug for revalidation

### `ToolService`

- `getPublicDownload` enforces free + valid checksum
- Catalog methods stay thin wrappers over the public repository

## 9. Dashboard changes

`/dashboard`

- Status badge styling for draft / published / archived

`/publish`

- Copy updated: draft then upload/publish from dashboard

`/dashboard/tools/[id]`

- Tool information (read-only when archived)
- Platforms
- Versions: No binary / Uploaded / Current release / Set as current release
- Current release summary
- Publishing status: version select on first publish, public page link when published
- Archive only for draft/published

Server Actions: `publishTool` reads `versionId`; `setCurrentRelease`; upload finalize stores metadata; download uses attachment signing.

Owner is always `syncCurrentUser().id`, never a client-supplied owner id.

## 10. Public marketplace changes

### Homepage `/` and `/search`

- `dynamic = "force-dynamic"` so CI/build does not need a live DB
- Catalog from `ToolService` (published only)
- Search: name, shortDescription, description (`ilike`)

### ToolCard

- name, short description, platforms, Free/price, current version if present

### Tool detail `/tools/[slug]`

- Product-style layout: purpose, full description, platforms, price, release, version, date, SHA-256, filename, file size
- Free + valid release → Download
- Free + no release → disabled “Download unavailable”
- Paid → “Purchase soon”, never a download href

### Download `/tools/[slug]/download`

- Service-backed; 403 paid; 404 otherwise; 307 to presigned GET

Draft/archived slugs 404 from `findBySlug`.

## 11. R2 / storage changes

`r2-client.ts` was removed. Config is lazy inside `r2-storage.ts` so importing the module during tests/CI does not throw until a URL is created.

Upload: presigned PUT, then optional `HeadObject` for size/type.

Download signing sets:

- `ResponseContentDisposition: attachment; filename="..."; filename*=UTF-8''...`
- `ResponseContentType` from stored type or `application/octet-stream`

Filename sanitization strips path segments and unsafe characters. Missing metadata falls back to the last `fileKey` segment.

Secrets (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) stay server-side. The browser only receives short-lived URLs.

## 12. Authentication and authorization

- Mutations: `requireUser()` → `services.auth.syncCurrentUser()`. Unauthenticated users redirect to `/login`.
- Tool access: `getToolForOwner(toolId, appUser.id)`. A guessed `toolId` for another owner is `Tool not found`.
- Version access: version must exist on that owned tool before upload/download/set-release.
- `versionId` / `toolId` from the browser are untrusted IDs; ownership is always re-checked.
- Public repository queries `status = published` only.
- Service role / DB URL / R2 keys are not `NEXT_PUBLIC_*`.

## 13. Error handling

Strategy: throw `ToolError` (or `Error` with a user-facing message) in services; Server Actions catch and `redirect` to `?error=` on the same page. Client upload helpers return `{ ok: false, error }` instead of throwing through the Next overlay.

Examples:

- Version already exists.
- Binary must be uploaded before publishing.
- Checksum is invalid.
- Selected release does not belong to this tool.
- Tool is archived.
- Only draft tools can be initially published. (non-draft non-archived path)
- Tool is already published.
- Paid downloads are not available yet.
- Tool not found.

Request form also redirects with `?error=` instead of an uncaught exception.

## 14. Tests

Vitest (`vitest.config.ts`, `npm test` / `npm run test:watch`).

| File | Scenarios |
| --- | --- |
| `src/modules/tools/services/developer-tool-service.test.ts` | duplicate version, invalid semver, publish without version, without binary, without checksum, valid publish + stored currentVersionId, release of another tool, invalid release, archived mutations, published release switch, already published |
| `src/modules/tools/services/tool-service.test.ts` | catalog get, get by slug, unknown slug, search name/description, free vs paid download |
| `src/modules/tools/domain/version-rules.test.ts` | semver, SHA-256, latest releasable, filename sanitization |

In-memory repositories isolate tests from PostgreSQL/R2.

## 15. CI

`.github/workflows/ci.yml`

- Triggers: `push`, `pull_request`
- Node 22, `npm ci`, `npm run lint`, `npm test`, `npm run build`
- Dummy env only (no production secrets): `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_*`, `R2_*`
- Public DB pages are `force-dynamic` so build does not connect to Postgres

## 16. Important files

- `src/infrastructure/db/schema.ts` — Drizzle model, current release, metadata, uniqueness
- `drizzle/0001_explicit_current_release.sql` — migration + backfill + composite FK
- `src/modules/tools/domain/version-rules.ts` — releasable/semver/checksum/filename rules
- `src/modules/tools/domain/tool-error.ts` — user-facing error type
- `src/modules/tools/services/developer-tool-service.ts` — owner business rules
- `src/modules/tools/services/tool-service.ts` — public get/search/download
- `src/modules/tools/repositories/postgres-tool-repository.ts` — published catalog + current release join
- `src/modules/tools/repositories/postgres-developer-tool-repository.ts` — owner writes
- `src/modules/tools/repositories/in-memory-developer-tool-repository.ts` — tests
- `src/infrastructure/storage/r2-storage.ts` — lazy R2 client, attachment URLs, HeadObject
- `src/app/dashboard/tools/[id]/page.tsx` — version/release UX
- `src/app/dashboard/tools/[id]/actions.ts` — Server Actions, revalidatePath
- `src/app/tools/[slug]/page.tsx` — public product page
- `src/app/tools/[slug]/download/route.ts` — public download
- `.github/workflows/ci.yml` — CI
- `docs/architecture/releases.md` — release design
- `docs/architecture/storage.md` — R2 design

## 17. Environment variables

Names only:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_REGION`
- `NODE_ENV`

## 18. Commands

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
npm run db:generate
npm run db:push
psql "$DATABASE_URL" -f drizzle/0001_explicit_current_release.sql
npm run db:seed
```

## 19. Known limitations

- Stripe Connect / paid checkout not implemented (paid tools show Purchase soon; download is 403)
- No version deletion UI (RESTRICT on current release is still correct)
- No HeadObject verification of checksum against the object body
- Seed script does not create versions or current releases
- RLS is declared on tables (`pgTable.withRLS`); policies were not expanded here
- In-memory public catalog is for tests/dev shape only; production uses Postgres
- `package-lock.json` was regenerated when Vitest was installed

Intentionally not built: subscriptions, affiliates, AI generation, antivirus, code signing, desktop client, chat, mobile, analytics, admin moderation.

## 20. Recommended next steps

1. Run `drizzle/0001_explicit_current_release.sql` against the real database and spot-check published tools’ `current_version_id`.
2. Implement Stripe Connect and gate paid `getPublicDownload` on a completed purchase.
3. Add a version deactivate/delete flow that refuses to remove the current release.
4. Tighten Supabase RLS policies to match owner vs public read rules.
5. Replace `db:seed` with published tools that have binaries/current releases for local demos.

## 21. Validation result

- `npm run lint`: **PASS**
- `npm test`: **PASS** (20 tests, 3 files)
- `npm run build`: **PASS** (TypeScript included)

One test was fixed during iteration 9: in-memory Metadata Cleaner copy does not contain “exif”; search now asserts on “embedded metadata”.

## 22. Git status

- Branch: `main` (tracking `origin/main`, **not pushed**)
- Changes are **uncommitted** in the working tree
- Modified: schema, services, repos, dashboard, public pages, download route, R2 storage, README, package.json / lockfile
- Deleted: `src/infrastructure/storage/r2-client.ts` (logic moved into lazy `r2-storage.ts`)
- New: `.github/workflows/ci.yml`, `drizzle/0001_explicit_current_release.sql`, `docs/architecture/*`, Vitest config and tests, `ToolError` / version-rules, in-memory developer repository, `postgres-errors.ts`, this report
