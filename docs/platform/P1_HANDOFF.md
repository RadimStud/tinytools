# MiniKit platform P1 — implementation and validation handoff

Date: 13 September 2026. Status: review candidate; not merged or activated.
Repository: RadimStud/tinytools. ORION repository and data are unchanged.
PR: https://github.com/RadimStud/tinytools/pull/5
Branch: feature/platform-p1-accounts
Base PR: #4 / fix/m2-beta-readiness (must be integrated before this stacked PR).
Previous checkpoint: 6046c3637b3f822a2f126401c49907422898ff43.
Verified application/test revision: d437f76b6796595073a5b8b4895466755ceebe46.

## 1. What changed after the checkpoint

The branch and draft PR now exist. The checkpoint has passed full CI and actual
isolated PostgreSQL tests, not only stand-alone Node assertions.

A display-level session boundary now protects the private workspaces when
MINIKIT_PLATFORM_ENABLED=1. It is mounted through route templates for apps,
account, platform administration, Market dashboard, publishing, Market admin
and the owner vault. Each template still uses the existing server-authenticated
Supabase user. It does not grant application or admin rights.

The boundary waits for GET /api/auth/session to return the same verified Auth
UUID before mounting private components. Account changes hide the DOM and
unmount stale workspace state; completed changes use a full browser navigation
to discard old React/Next router state. Slow responses from an earlier check
cannot restore invalidated state. Focus, visibility and pageshow trigger a fresh
check; pagehide hides content before a possible back/forward-cache restoration.
Visible pages also recheck at 30-second intervals. A failed check fails closed.

BroadcastChannel and a transient storage-event fallback carry only a versioned
invalidation hint and nonce, never identity, tokens, cookies or file/chat data.
A pending same-tab form is hidden but kept mounted until React starts its server
action. Other tabs discard their private components. Duplicate local/broadcast/
storage hints are processed once using a bounded phase/nonce set. Pending changes
cannot be unblocked by a stale identity response or a focus event. Reload securely
is the explicit recovery path if a change is abandoned or fails; it does not
resubmit an authentication action.

Successful login, signup with a session, password update and logout invalidate
the Next layout cache and use /auth/complete when the platform is enabled.
The auth callback uses the same completion path. This page broadcasts a completed
change and navigates to a server-validated destination. It does not authenticate
anyone or accept arbitrary return URLs. With the platform disabled the existing
/dashboard landing and direct redirects remain in place.

The Supabase proxy now preserves approved deep links when an unauthenticated
visitor requests a private page. It derives the target from the actual request,
not X-User-Id, localStorage or client-supplied redirect headers. This is an early
negative check only; pages, services and repository mutations retain server-side
authorization.

Shared workspace navigation now links Market, My apps and Account and offers
an explicit Sign out everywhere action. Existing Market administration and
Superuser rights have not been replaced with platform permissions.

## 2. Existing P1 foundation retained

- Existing Supabase project remains the identity provider. authUserId is the
  cross-application UUID; internal users.id remains for legacy ownership links.
- /apps shows Market, local CSV Cleaner and ORION. ORION always has a null launch
  path in P1, even if someone changes a grant or catalog row.
- Platform administration is /platform/admin, not /admin/platform. The existing
  /admin layout requires a Market admin and must not define platform privileges.
- Explicit platform_admins is separate from users.role, app_access.app_role and
  the owner's superuser_permissions. Registration/user metadata grants none of them.
- Explicit app access changes recheck the operator inside the SQL transaction,
  serialize a user/app pair, check expected_policy_version, and commit the change
  together with its audit. A stale update becomes policy_conflict, not lost data.
- P1 cannot edit the existing free Market/CSV access policies. Suspending an ORION
  grant is not a global account ban and does not block unrelated legacy routes.
- limits=null and paid_operations_enabled=false mean paid operations are disabled,
  never an unlimited allowance.
- The access response is a catalog/grant description, not an operation authorization
  or a signed assertion for an external service.

## 3. API surface in this P1 candidate

All /api/platform/v1 responses use data OR error plus a server-generated request_id.
Personalized responses are private/no-store and Vary: Cookie.

| Method | Path | Semantics |
| --- | --- | --- |
| GET | /api/platform/v1/me | Verified subject, display_name, platform_permissions. |
| GET | /api/platform/v1/apps | Own application views and safe/null launch paths. |
| GET | /api/platform/v1/apps/{appId}/access | Own informational app view; NOT a service token. |
| PUT | /api/platform/v1/admin/access | Explicit app grant mutation, operator check and audit. |
| GET | /api/auth/session | Display-boundary plumbing: only verified subject; not the versioned integration API. |

Admin mutation payload: subject, app_id, status (enabled/suspended/revoked),
app_role (user/app_admin), expected_policy_version and a 5–500 character reason.
The operation does not grant platform administration. JSON is limited to 8 KiB;
Origin must exactly match the explicitly configured platform origin.

Known platform error codes include unauthenticated (401), access_denied (403),
origin_rejected (403), app_not_found/user_not_found (404), invalid_request (400),
policy_conflict/free_policy_not_editable (409), payload_too_large (413),
json_required (415), platform_disabled/platform_unavailable (503).
The session plumbing instead returns its own small 401/404/503 error payload.

## 4. Actual validation and its limits

For d437f76b6796595073a5b8b4895466755ceebe46, all three GitHub PR workflows
completed successfully:

- CI: 34754980903 — lint, 188 Vitest tests in 23 files, and production build including TypeScript.
- Platform P1 isolated checks: 34754980904 — 10 PostgreSQL 16 tests plus 12 Chromium session-harness tests; all passed.
- Workbench browser tests: 34754980887 — proposed Next production build, CSV and disabled-platform pages.

These are GitHub Actions runs, not local execution in the editing container.
An earlier strict TypeScript error in an auth test was corrected. A later browser
regression caught a duplicated pending hint reaching the emitting window through
BroadcastChannel; hints are now deduplicated by phase/nonce in a bounded set.
The local submit action is dispatched once, private content stays hidden and
Reload securely remains available after a failed/abandoned action. No test was
removed or weakened to hide these failures.

The downloaded final HTML report (artifact 10316862462) contains 12 expected,
0 unexpected, 0 skipped and 0 flaky browser results. The existing dependency
installation still reports two moderate advisories; these were not triaged or
fixed in this P1 change.

Verified runs:
- https://github.com/RadimStud/tinytools/actions/runs/34754980903
- https://github.com/RadimStud/tinytools/actions/runs/34754980904
- https://github.com/RadimStud/tinytools/actions/runs/34754980887

The PostgreSQL suite uses synthetic A/B/operator/Market-admin identities and a
representative legacy fixture. It checks migration repeatability, no automatic
promotion, preserved legacy sentinels, separation of A/B grants, repository-level
operator denial/revocation, concurrent writes, policy conflicts, audit rollback,
foreign keys, uniqueness, and denied direct client-role access.
This fixture is not a restored copy of production, and these are NOT real Supabase
signup accounts. The browser harness imports the actual SessionBoundary component
but intercepts its identity API. It tests client state isolation, not provider
session issuance. The production-build browser job deliberately disables the
platform and uses dummy infrastructure configuration. It does not test live R2.

Still NOT verified in this iteration:
- real Supabase staging registration, delivered confirmation/recovery emails and
  password update through an issued recovery session;
- full enabled Next portal with two real staging users and the actual provider;
- real authenticated Market/R2/vault end-to-end regression after these changes;
- actual production role grants, backups, credential rotation or provider billing.

Supabase global sign-out revokes refresh sessions. Already-issued access tokens
can have provider-defined remaining validity. Cross-tab display invalidation is
not a promise of immediate cross-device token revocation. A provider session
registry/introspection requirement must be resolved for P2/P3 operational policy.
Existing auth endpoints remain server-authorized; browser hiding is not authorization.

## 5. Running the existing checks

Prerequisites: Node 22, npm, and Chromium for Playwright. No real login, R2 or AI
credentials are needed for the isolated checks. Full project build requires the
same non-secret dummy infrastructure settings used in CI or a reviewed staging
configuration. Do not use your production .env.local for a staging deployment.

PowerShell (run from an already-fetched, clean review checkout):

```powershell
& {
    $ErrorActionPreference = 'Stop'
    Set-Location 'C:\Development\tinytools'
    npm ci
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' }
    npm run lint
    if ($LASTEXITCODE -ne 0) { throw 'lint failed' }
    npm test
    if ($LASTEXITCODE -ne 0) { throw 'unit tests failed' }
    npx playwright install chromium
    if ($LASTEXITCODE -ne 0) { throw 'Chromium install failed' }
    npx playwright test --config=playwright.platform.config.ts
    if ($LASTEXITCODE -ne 0) { throw 'isolated browser tests failed' }
}
```

The database suite additionally requires PLATFORM_TEST_DATABASE_URL pointing
only to a loopback minikit_platform_test database, without query parameters or
fragments. It does not load dotenv or use DATABASE_URL.
Command: npx vitest run --config=vitest.platform.config.ts.
That suite creates synthetic data and truncates ONLY its isolated platform test
tables. Never point it at a development or production database containing real data.

## 6. Migration, configuration and rollback — not executed in production

Migration: drizzle/0004_platform_accounts.sql. It adds platform_apps,
platform_admins, app_access and admin_audit_events, enables RLS and revokes direct
public/client grants on those new tables. It does not reset Market users or vault
ownership and does not automatically promote a Market administrator.

Staging migration command: node scripts/platform-db.mjs migrate --apply.
The script reads .env.local without overriding environment variables. Verify the
selected database outside logs before running it; the target must be deliberate.
Initial operator bootstrap needs --apply, --subject, an identical --confirm-subject
and --reason. The chosen Auth UUID must already map to a MiniKit application user.
No specific operator is prefilled or granted by this PR.

Configuration names only:
- MINIKIT_PLATFORM_ENABLED: 1 only after reviewed migration/bootstrap and validation.
- MINIKIT_PLATFORM_ORIGIN: exact origin, no slash/path, https except loopback tests.
- AUTH_ALLOWED_ORIGINS: reviewed allowlist for signup/recovery callbacks.
- Existing DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL and publishable key remain needed.

Local portal example (after isolated/staging provider and DB are configured):
http://localhost:3000/apps. There is NO new verified staging hostname in this handoff.
Existing production remains https://tinytools-ten.vercel.app with the old main.

Rollback: disable MINIKIT_PLATFORM_ENABLED, restore the previous application
revision, retain new tables/audit records. Do not DROP tables or reset identities
as a routine rollback. Domain/callback changes and secret provisioning are a
separate deployment step, not a side effect of merging.

## 7. Boundary for ORION and P2

P1 is still not a usable ORION identity integration. No signer, signing key,
JWKS endpoint, internal service credential, API gateway or token-verification
implementation was added by this P1 increment. Do not implement an ORION adapter
against the informational access response. Do not proxy the single-owner backend.

P2 must provide an implemented/tested service contract and ORION_PLATFORM_HANDOFF.md
before calling the handoff ready. That document must identify exact issuer,
audience, algorithm, kid/key rotation, clock skew, short token lifetime, approved
routes and methods, identity-header removal, request/response bounds, revocation,
private caching, service authentication, errors and a real A/B test-service run.
Do not invent these values based on this P1 file. Financial reservation and account
export/deletion stay explicitly unimplemented until their own P3 checks pass.

Source assignment: owner-provided shared-platform specification v1.0, 13 Sep 2026.
Primary references consulted:
- https://nextjs.org/docs/app/guides/authentication
- https://supabase.com/docs/guides/auth/server-side
- https://supabase.com/docs/guides/auth/server-side/advanced-guide

The editor did not have the installed Next docs/dependencies;
the existing pinned project was built and tested in repository CI.
