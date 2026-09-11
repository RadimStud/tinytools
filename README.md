# MiniKit Market

Marketplace MVP for small, focused software tools that solve specific problems.

**Product name:** MiniKit Market  
**Short brand:** MiniKit  
**Repository / internal legacy name:** `tinytools`

The GitHub repository, npm package name, database identifiers, and current production host may still use `tinytools`. That is intentional until infrastructure is renamed.

## Stack

- Next.js 16 and TypeScript
- Tailwind CSS
- PostgreSQL, Drizzle ORM
- Supabase Auth
- Cloudflare R2 (private bucket, server-side presigned URLs)

## Commands

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```

## Database

Schema source of truth: `src/infrastructure/db/schema.ts`.

```bash
npm run db:generate
npm run db:push
```

Apply the explicit current-release SQL as well (unique version constraint, file metadata columns, same-tool current release FK, backfill):

```bash
psql "$DATABASE_URL" -f drizzle/0001_explicit_current_release.sql
psql "$DATABASE_URL" -f drizzle/0002_admin_roles.sql
```

Promote a single operator after the role migration (never grant admin to everyone):

```sql
UPDATE users
SET role = 'admin'
WHERE auth_user_id = '<supabase-auth-user-uuid>';
```

If you already use `db:push` after pulling this schema, still run that SQL file so the composite `tools_current_version_same_tool_fk` constraint exists. It is idempotent.

```bash
npm run db:seed
```

## End-to-end smoke tests

Playwright covers a real browser path: login, draft, upload to R2, publish, public download, archive.

Credentials have **no defaults**. Never commit `E2E_EMAIL` or `E2E_PASSWORD`.

Install the browser once:

```bash
npx playwright install chromium
```

Local app (terminal 1):

```bash
npm run dev
```

Local tests (terminal 2):

```powershell
$env:E2E_BASE_URL="http://localhost:3000"
$env:E2E_EMAIL="..."
$env:E2E_PASSWORD="..."
npm run test:e2e
```

Production smoke currently targets the existing Vercel host (legacy `tinytools` project name):

```powershell
$env:E2E_BASE_URL="https://tinytools-ten.vercel.app"
$env:E2E_EMAIL="..."
$env:E2E_PASSWORD="..."
npm run test:e2e:production
```

`npm test` remains Vitest only. Authenticated production E2E is not part of the push/PR CI workflow; use `.github/workflows/production-smoke.yml` (`workflow_dispatch`) after GitHub Secrets `E2E_EMAIL` and `E2E_PASSWORD` are set.

## Private superuser workspace

The designated owner has a Matrix-inspired private file vault at `/superuser`,
accessible through the **Superuser** dashboard button. The permission is separate
from admin and constrained to the single owner account in the database.

Before deploying this feature, run `node scripts/migrate-superuser.mjs` against
the deployment database using your local `.env.local`. See
[`docs/architecture/superuser-vault.md`](docs/architecture/superuser-vault.md)
for deployment order, storage behavior and verification.

## Browser workbench and community

`/workbench/csv-cleaner` is a free CSV/TSV utility that processes file contents
entirely in the browser (UTF-8, 2 MiB, 100,000 cells). It preserves text values,
supports quoted/multiline fields, and previews trimming, duplicate removal and
blank-row removal before exporting a new copy. No database migration is needed.

`/community` links to the public issue templates and contribution guide. See
[CONTRIBUTING.md](CONTRIBUTING.md) and the
[market/opportunity analysis](docs/MINIKIT_MARKET_OPPORTUNITIES.md).

After a production build, run the database-independent browser suite with
`npx playwright test --config=playwright.workbench.config.ts`. The workbench CI
workflow installs Chromium and saves screenshots/traces as a seven-day artifact.
The production site can also be checked using the ordinary Playwright config:
`npm run test:e2e -- tests/e2e/workbench.spec.ts` with `E2E_BASE_URL` set.

## Architecture

UI and routes call services. Services use repository interfaces. PostgreSQL and R2 stay in `src/infrastructure`.

See `docs/architecture/releases.md` and `docs/architecture/storage.md`.

Historical handoff docs (`CURSOR_IMPLEMENTATION_REPORT.md`, `ADMIN_MVP_IMPLEMENTATION_REPORT.md`, `E2E_SMOKE_IMPLEMENTATION_REPORT.md`) still describe work done under the TinyTools name.
