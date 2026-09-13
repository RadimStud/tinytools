# MiniKit to ORION — validated P2 diagnostic contract

Date: 13 September 2026. Contract: `minikit.orion/1.0`.
Application/test revision: `c616396b402106468aeabda0420b621e45e9a8ba`.
[PR #9](https://github.com/RadimStud/tinytools/pull/9) follows P2 #6, P1 #5 and #4.
This handoff records implemented and tested MiniKit behavior. The ORION repository
and production accounts were not modified by this delivery.

## Accepted scope

The gateway, signed request identity, live account/session authorization and
diagnostic job contract passed the isolated provider integration. The service
used by those tests is `tests/platform-full/orion-service.ts`, a loopback fixture,
not the six-assistant ORION application. The accepted operation is `contract.echo`.
The frontend still describes ORION as coming soon, and catalog launch paths are
null. This delivery does not enable hosted chats, Project Lab or paid operations.

The owner requires the existing MiniKit hosting/services. The parallel ORION
thread owns the Vercel adaptation and its persistent storage. A separate runtime
component does not authorize provisioning another hosting provider.

## Implemented interfaces

[orion-v1.openapi.yaml](orion-v1.openapi.yaml) is the machine-readable API schema.
The browser uses MiniKit's verified Supabase cookie session and calls the fixed
prefix `/api/apps/orion`. The corresponding service paths are:

| Browser suffix | Service path | Purpose |
| --- | --- | --- |
| `GET /v1/context` | `GET /v1/context` | Account, current grant version and diagnostic-mode status. |
| `POST /v1/jobs` | `POST /v1/jobs` | Create `contract.echo` with `{input: {text}}`. |
| `GET /v1/jobs/{jobId}` | `GET /v1/jobs/{jobId}` | Read an owned diagnostic job. |
| `POST /v1/jobs/{jobId}/run` | `POST /v1/jobs/{jobId}/run` | Execute diagnostic work with an empty JSON object. |

POST calls require the exact MiniKit Origin, `application/json`, and a UUID
`Idempotency-Key`. If present, `Sec-Fetch-Site` must be `same-origin`. The gateway
accepts at most 32 KiB of actual request bytes and at most 64 KiB of service
response bytes; diagnostic text is capped at 4096 characters. It applies a
five-second upstream timeout and does not follow redirects. Responses are
schema-checked and account-bound; read/run job IDs and context policy versions
must also match. Stored jobs can retain their original policy version.

MiniKit exposes `GET /api/platform/v1/jwks` for public verification keys and
`POST /api/platform/v1/internal/orion/authorize` for execution reauthorization.
The latter requires a dedicated machine bearer credential, rejects Cookie and
Origin headers, and checks the live subject, session and expected policy version.
Its request is `{subject, session_id, policy_version, operation_id,
operation: "contract.echo"}`. It authorizes no paid operation.

P1 `/me`, `/apps` and `/apps/{appId}/access` describe identity/catalog/access.
Their JSON is not a signed service authorization. Market admin, platform admin,
application grants and owner-vault permission remain distinct.

## Identity and service verification

MiniKit signs a compact ES256 JWT using a configured EC P-256 key. The protected
header permits only `alg`, `kid`, and `typ=minikit-service+jwt`. Issuer and public
keys must come from trusted configuration. No key URL embedded in a request is
trusted. The signer verifies that its private key matches a published public key.

The exact strict claims are defined in `gateway/contract.ts`: `iss`, `aud=orion`,
`sub`, `sid`, `iat`, `exp`, `jti`, `request_id`, `app_id=orion`,
`permissions=["orion.use"]`, `policy_version`, `v=minikit.orion/1.0`, `htm`, `htu`,
`body_sha256`, and `idempotency_key`. `sub` is the verified Supabase Auth UUID;
it is not the legacy Market `users.id`. `sid` is its verified session UUID.

The token lifetime is 45 seconds with three seconds of clock tolerance. The
reference verifier rejects it at `iat + 48 seconds`. Method, service-relative
path, exact forwarded UTF-8 body hash and idempotency key must match. GET binds
the empty body. The verifier consumes each `jti` once. A real multi-instance
service needs an atomic shared replay store; the fixture's in-memory maps are
only for its single-process tests.

Browser cookies, user-supplied identity headers, bearer credentials and forwarded
hosts are not relayed. Only server-reconstructed headers reach the fixed target.
Signing tokens and private keys are never returned to the browser. The service
must verify identity before selecting the user workspace and reauthorize queued
execution against live platform policy/session. MiniKit also rechecks access
before returning a result, including policy changes during execution.

## Configuration and remaining runtime work

The existing implementation intentionally requires:

- `MINIKIT_PLATFORM_ENABLED=1`.
- `MINIKIT_ORION_GATEWAY_MODE=contract-test`.
- `MINIKIT_DEPLOYMENT_ENV=isolated-test` or `staging`.
- `MINIKIT_PLATFORM_ORIGIN`, `ORION_INTERNAL_ORIGIN` and `MINIKIT_IDENTITY_ISSUER`.
- `MINIKIT_IDENTITY_PRIVATE_JWK`, `MINIKIT_IDENTITY_PUBLIC_JWKS`, and
  `ORION_SERVICE_CREDENTIAL`, supplied as deployment secrets where appropriate.

`VERCEL_ENV=production` is rejected. Origins must be exact HTTPS origins, with
HTTP allowed only for explicit loopback isolated tests. No public staging URL
or actual production secret values are supplied here. The rate guard permits
60 admitted requests per account per minute across application instances; it
is separate from a financial budget.

The real ORION adapter must bind every operation and browser state to the verified
account, preserve the owner's legacy data separately, and use persistent storage
suited to the existing hosting. Its current absolute `/api/...`, `/auth/...` and
asset paths need a deliberate integrated transport. This diagnostic gateway does
not accept the old `/api/call` method-dispatch API or large uploads. Application
operations, file transfers, reservations/settlement, account export/deletion and
production activation need their own validated implementation. `limits=null`
and `paid_operations_enabled=false` mean no paid allowance.

## Evidence

All following checks passed on the application/test revision above. Logs were
inspected; the provider reporter recorded no skipped or failed tests.

| Check | Result | Run |
| --- | --- | --- |
| ESLint, unit tests, production build/TypeScript | 249 tests passed | [CI](https://github.com/RadimStud/tinytools/actions/runs/34781830458) |
| P1 isolated database and session harness | 10 database + 12 browser tests passed | [P1](https://github.com/RadimStud/tinytools/actions/runs/34781830446) |
| Workbench browser regression | Passed | [Workbench](https://github.com/RadimStud/tinytools/actions/runs/34781830462) |
| Actual isolated providers and Chromium | 20 passed; 0 failed; 0 skipped | [P2](https://github.com/RadimStud/tinytools/actions/runs/34781830484) |

P2 exercised delivered confirmation/recovery emails, two account identities,
grant changes, owned jobs, revocation, password recovery and rejection of the old
session, vault/admin denial, real browser Market upload/download, logout across
tabs and service rejection of malformed assertions. It used disposable GoTrue,
PostgreSQL, Mailpit and S3-compatible storage. It did not test production Supabase
or R2, real ORION data isolation through this adapter, or paid AI calls.

Review-specific fixes and integration order are recorded in
[P2_READINESS_REVIEW.md](P2_READINESS_REVIEW.md). Preserve the independent
`/superuser/orion` launcher change on `main` when integrating the stack. Production
deployment and migration remain separate from accepting this diagnostic contract.
