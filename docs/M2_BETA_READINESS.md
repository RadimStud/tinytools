# M2 beta readiness: hardening and first-user feedback

Started: 2026-09-12. Baseline: `ec8fc5894c27496055ecb6a4c8c8ac6e75ae42c2`.
This is a focused iteration, not closure of M2 or a full security certification.

## Changes and reasons

- `safe-redirect.ts` replaces the callback's `startsWith("/")` check. Previously
  `//external.example` could leave the application after successful code exchange.
  Local paths are normalized with the URL parser. External/protocol-relative URLs,
  backslashes, control characters and malformed encoded paths fall back to `/dashboard`.
- The callback still uses Supabase code exchange and application user synchronization.
  Its failure redirect no longer includes upstream error text; redirects are no-store.
- `/api/db-health` returns a generic 503 for failed checks (including configuration
  imports) instead of exposing the raw database error. Successful checks retain the
  existing service/status/timestamp shape. No credentials, SQL or upstream errors
  are logged. The private/no-store response is not a claim of access restriction.
- Added helper and route regression tests, including successful exchange, no user,
  upstream errors, valid/invalid targets and empty database results. Auth/DB are
  mocked in these tests; this does not prove the real signed-in flow.
- `playwright.public.config.ts` selects ONLY public, workbench and beta-readiness
  specs. It does not load dotenv, credentials, the general config or saved sessions.
  The default target is the existing production origin; localhost is also allowed.
  One worker, no retries, no login, database writes, R2 uploads or issue submissions.
- Public checks cover real availability, anonymous admin redirects, CSV export,
  synthetic content egress checks, clearing after reload, UTF-8 errors and responsive
  screens. These are evidence for the exercised cases, not a universal privacy proof.
- The CSV page links to a dedicated public GitHub feedback form: task, outcome,
  obstacle and optional repeat use. No CSV contents, filename or account details
  are attached. Submission requires an explicit action on GitHub. No analytics,
  tracker, email campaign or invented audience was added.

## How to run

```powershell
cd C:\Development\tinytools
npm ci
npx playwright install chromium
npx playwright test --config=playwright.public.config.ts
```

This command tests the CURRENT public site, not unmerged local edits. To run
against an already-started local application with a configured test database:

```powershell
$env:E2E_PUBLIC_BASE_URL = "http://localhost:3000"
npx playwright test --config=playwright.public.config.ts
Remove-Item Env:E2E_PUBLIC_BASE_URL
```

`playwright.workbench.config.ts` tests the PR production build without database
access and includes the new feedback-link test. Do not run the live-DB readiness
probe against its intentionally dummy database.

## CI and scope

`Public beta checks` runs on matching same-repository PRs and `workflow_dispatch`.
It checks the CURRENT production release, not the PR preview. It is deliberately
separate from the CI/workbench jobs that build and test the proposed commit.
No schedules, production credentials or authenticated browser state are used.
Artifacts expire after seven days. Review artifacts before sharing: they can
contain publicly rendered page data and synthetic fixtures.

Existing authenticated marketplace and superuser suites are unchanged and opt-in.
No broad automated data cleanup, migration, credential rotation or production
mutation was executed by this iteration. Existing secret values are not needed
for these public checks and must not be pasted into chat or issue reports.

## Deployment

No dependencies or SQL schema changes. Review/merge the PR and allow Vercel to
build it. After deployment, rerun the public suite; test a real login separately
with the existing securely configured authenticated suite. A successful PR job
against old production does not prove the patch is deployed.

The CSV feedback template becomes available when it is on the repository's
default branch. Its link in a preview may not work until merge.

## Remaining M2 gates (not verified here)

| Gate | Evidence needed before marking done |
| --- | --- |
| Credential rotation | Operator confirms exposed DB/R2 credentials revoked and replacements work locally and in the deployment. Do not record values. |
| Backup and restore | Successful restore to an isolated database with row/release checks; verify private object recovery separately. A backup setting alone is insufficient. |
| Users/role protection | Audit actual DB grants, RLS policies and every profile mutation; ensure a user cannot write their role. Admin-only UI is not proof. |
| Authenticated production E2E | Real login, marketplace upload/release/download/archive, owner vault round trip and non-owner denial; do not count skipped tests. |
| Binary integrity | Server-side verification and immutable finalized objects remain separate from displaying a client-supplied checksum. |
| First real users | Collect real task outcomes; CI passes and GitHub stars are not active users. |

## First-user experiment

Use the CSV Cleaner as the entry point, not the private vault. Keep the existing
internal targets: five distinct use cases, three independent useful outcomes and
one user-confirmed repeat use. They are goals, not current results. Use the new
issue form to record outcomes without original files; link fixes to the user's
issue and ask them to verify their case. Do not launch paid features or a broad
outreach campaign before the operational gates above are understood.

## Validation record

- Native Node 22 TypeScript-stripping check: 24 safe-redirect vectors passed.
- Full lint, Vitest, build and browser results: to be filled from GitHub Actions
  after this commit; no local dependency installation/build was claimed.
- The editing runtime has no GitHub/npm DNS access. Source was read/written using
  the authorized GitHub connector. Direct web fetching of the deployment was not
  available; live availability will be established by the public CI job.

## Primary documentation consulted

- https://nextjs.org/docs/app/guides/testing/playwright
- https://playwright.dev/docs/test-configuration
- https://playwright.dev/docs/ci-intro

The checkout instruction refers to installed `node_modules/next/dist/docs`; it is
not available in the editing runtime. No Next dependency/version change is made.
