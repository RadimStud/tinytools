# TinyTools Admin MVP Implementation Report

## Summary

This iteration adds a **read-only internal admin panel** with a PostgreSQL `user_role` (`user` | `admin`), server-side admin authorization, and `/admin` overview/tools/users pages. Existing marketplace auth is unchanged. Admin UI never talks to Drizzle or Supabase directly.

`node_modules/next/dist/docs` was not present in this install. Admin protection follows the same Next.js 16 App Router pattern already used by `/dashboard`: async Server Components, `redirect()` from `next/navigation`, and `export const dynamic = "force-dynamic"`. Session refresh stays in `proxy.ts`; admin checks are **not** only a hidden nav link.

## Files changed

### Schema and migration

- `src/infrastructure/db/schema.ts` — `userRoleEnum`, `users.role`
- `drizzle/0002_admin_roles.sql` — idempotent enum + column (not applied automatically)

### Domain / users

- `src/modules/users/domain/user.ts` — `UserRole`, `role` on `AppUser`, `isAdminUser()`
- `src/modules/users/repositories/user-repository.ts` — unchanged interface; `findOrCreate` still used
- `src/modules/users/repositories/postgres-user-repository.ts` — maps `role`; existing rows returned as-is
- `src/modules/users/repositories/in-memory-user-repository.ts` — test double
- `src/modules/users/repositories/in-memory-user-repository.test.ts`

### Admin module

- `src/modules/admin/domain/admin-catalog.ts`
- `src/modules/admin/repositories/admin-repository.ts`
- `src/modules/admin/repositories/postgres-admin-repository.ts`
- `src/modules/admin/repositories/in-memory-admin-repository.ts`
- `src/modules/admin/repositories/in-memory-admin-repository.test.ts`
- `src/modules/admin/services/admin-authorization-service.ts`
- `src/modules/admin/services/admin-authorization-service.test.ts`
- `src/modules/admin/services/admin-service.ts`

### Wiring and UI

- `src/server/services.ts` — `adminAuth`, `admin`
- `src/app/admin/layout.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/tools/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/dashboard/page.tsx` — Admin link for `role === admin` only
- `README.md` — migration + promote-one-admin SQL

## DB migration summary

File: `drizzle/0002_admin_roles.sql`

1. Create `user_role` enum (`user`, `admin`) if missing.
2. `ADD COLUMN IF NOT EXISTS users.role user_role` (nullable first).
3. `UPDATE users SET role = 'user' WHERE role IS NULL`.
4. `ALTER COLUMN role SET DEFAULT 'user'`.
5. `ALTER COLUMN role SET NOT NULL`.

No statement promotes anyone to `admin`.

## Security decisions

- **Role lives in the application `users` table**, not in a client cookie or a `NEXT_PUBLIC_*` flag.
- **`findOrCreate` never writes `role` on an existing row.** Login/sync cannot demote an admin.
- New inserts omit `role` so PostgreSQL default `'user'` applies.
- **`requireAdmin()`** is used in the admin layout, each admin page, and `AdminService` read methods. Missing UI links is not the control.
- Unauthenticated → `/login`. Authenticated non-admin → `/dashboard` (no admin payload).
- Admin lists use a dedicated `AdminRepository`, not public `ToolRepository` (which filters `published` only).
- R2 / database / service-role secrets stay server-side. Admin pages only render data returned by services.
- `proxy.ts` still only refreshes the Supabase session; it does not grant admin.

## Tests

```bash
npm test
```

| File | Coverage |
| --- | --- |
| `admin-authorization-service.test.ts` | admin allowed; normal user redirected to `/dashboard`; anonymous redirected to `/login` |
| `in-memory-admin-repository.test.ts` | stats: users + published/draft/archived |
| `in-memory-user-repository.test.ts` | `findOrCreate` keeps admin role; new users are `user` |

Existing tool/release tests remain.

## Exact manual DB step after implementation

Do **not** rely on this agent applying the migration.

```bash
psql "$DATABASE_URL" -f drizzle/0002_admin_roles.sql
```

Then promote **one** operator by `auth_user_id` (Supabase Auth user UUID):

```sql
UPDATE users
SET role = 'admin'
WHERE auth_user_id = '<supabase-auth-user-uuid>';
```

Until that update, every existing account remains `user` and `/admin` redirects to `/dashboard` after login.

If you use `npm run db:push`, still run `0002` if you want the same idempotent SQL path; Drizzle schema already includes `role`.

## Known limitations / next admin iteration

- Read-only: no role editor, no archive/delete/approve, no version mutations.
- No audit log of who opened admin.
- RLS policies were not expanded for `users.role`.
- Admin is not a separate IdP; it is a column on the same AppUser as developers.
- Stats are live counts, not cached.
- Next recommended iteration: guarded mutations (archive tool, change role) with owner/admin checks, confirmation, and an audit table.

## Validation

Run locally after this change:

- `npm run lint`
- `npm test`
- `npm run build`
