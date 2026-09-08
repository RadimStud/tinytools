# TinyTools

Marketplace MVP for small, single-purpose desktop utilities.

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
```

If you already use `db:push` after pulling this schema, still run that SQL file so the composite `tools_current_version_same_tool_fk` constraint exists. It is idempotent.

```bash
npm run db:seed
```

## Architecture

UI and routes call services. Services use repository interfaces. PostgreSQL and R2 stay in `src/infrastructure`.

See `docs/architecture/releases.md` and `docs/architecture/storage.md`.

For a full handoff of the current-release work, read `CURSOR_IMPLEMENTATION_REPORT.md`.
