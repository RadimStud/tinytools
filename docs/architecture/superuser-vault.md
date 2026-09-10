# Superuser private vault

The dashboard exposes `/superuser` only to the explicitly granted account. This
is a separate permission, not an admin-role promotion. `superuser_permissions`
has a CHECK constraint allowing only application user
`2e954c50-23d5-4e68-be4c-ff9a61a697ad`. Signup, user metadata and the admin panel
cannot grant it. The existing admin role is preserved.

## Deployment order

1. Fetch this branch and install dependencies with `npm ci`.
2. Run `node scripts/migrate-superuser.mjs` from the repository root. It reads
   `.env.local`, applies `drizzle/0003_superuser_vault.sql` transactionally and
   verifies that exactly the intended authenticated application user has access.
   Run against the same database used by the deployment. It does not print secrets.
3. Only after migration succeeds, deploy the application. The existing dashboard
   queries the permission table, so the database migration must precede deployment.
4. Sign in as the owner, open Dashboard → Superuser and verify a file round trip.

Do not replace the explicit migration with `db:push`: the permission grant and
owner existence check are part of the migration. RLS is enabled without public
policies on both tables; the same privileged server database connection already
used by MiniKit performs operations after authorization.

## Storage and authorization

- Routes delegate to `VaultService`; every file operation rechecks authentication,
  persisted permission and ownership. API responses are private/no-store.
- Files use `vault/<owner-id>/<file-id>/payload`, separate from marketplace tools.
  The browser never chooses an object key. Duplicate filenames have separate IDs.
- Non-empty files up to 250 MiB are uploaded directly to the existing private R2
  bucket with a five-minute PUT URL. Existing R2 CORS must allow PUT and Content-Type
  from the deployment origin, as for the marketplace uploader.
- A pending database record reserves the expected size. Completion checks actual
  R2 size and only transitions pending records to ready. Interrupted uploads stay
  visible with Finish upload / Delete controls.
- Downloads require authorization and issue a 60-second bearer URL with attachment
  disposition and application/octet-stream. Uploaded HTML/SVG are never rendered
  on the application origin. Anyone already possessing a signed URL can use it
  until expiry; it is not a persistent public share link.
- Delete hides the database record first, then deletes the R2 object. A storage
  failure can be retried with the same ID. Pending PUT URLs can still be used until
  expiry; a late upload or failed cleanup may leave an unlisted R2 object requiring
  operator cleanup. A tombstone prevents it from becoming visible again.
- This is private access control, not end-to-end encryption or an anonymous
  network. Files are not part of the public tools catalog.

## Verification

`npm test` covers anonymous access, ordinary users, admins without permission,
permission revocation, ownership, malformed IDs, upload bounds, duplicate names,
incomplete uploads, deletion races, same-origin requests and error redaction.

`tests/e2e/superuser-access.spec.ts` checks anonymous page/API access.
The authenticated upload/download/delete test is opt-in:

```powershell
$env:E2E_SUPERUSER = "1"
# Set E2E_EMAIL and E2E_PASSWORD to the designated owner account securely.
npm run test:e2e:headed -- tests/e2e/superuser-vault.spec.ts
Remove-Item Env:E2E_SUPERUSER
```

The UI supports keyboard file selection, drag/drop, multiple sequential uploads,
progress, search, pending-upload recovery, deletion confirmation and reduced motion.
