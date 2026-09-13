# ORION integration readiness review

Date: 13 September 2026. Repository: `RadimStud/tinytools`.
Branch: `fix/orion-integration-readiness`, based on P2 commit
`cd60fe58dbb228f9fb0af43178f1cad4767337a3` / PR #6.
Implementation was prepared and locally verified as commit `5bc999d`.

The owner asked this thread to proceed while another thread implements the ORION
side of the previous plan. This change covers MiniKit's integration boundary and
its acceptance tests. The deployment constraint is the existing MiniKit hosting
and services; this work provisions no additional hosting.

## Completed changes

- The gateway checks that a read/run response has the exact job ID in the
  authorized request. A valid-looking response for another job owned by the same
  account is rejected with `502 invalid_app_response`.
- Context responses must match the current policy version in the signed request.
  Stored jobs may retain their original policy version; the account's current
  permission is still rechecked before returning them.
- Requests already cancelled at entry, or cancelled while identity is being
  signed, are stopped before upstream dispatch. This does not promise to undo
  operations already accepted by the service.
- The token lifetime test uses the same explicit clock for issuance and every
  verification. It preserves rejection at 48 seconds, rejection of excessive
  lifetime and future issuance, and the allowed three-second clock tolerance.
- The real-provider recovery test verifies that B's old session is rejected,
  signs B in again with the changed password, verifies B's identity and grant,
  then checks authenticated vault denial. It continues to require exactly 403
  for authenticated ordinary users; it does not accept either 401 or 403 merely
  to hide a broken session.
- Nine additional unit cases cover the gateway response and cancellation changes.
  The machine-readable OpenAPI contract describes the response binding.

## Verification and remaining gate

| Check | Result | Scope |
| --- | --- | --- |
| Unit suite | 249 passed, 26 files | Local Vitest; includes nine added gateway cases. |
| Gateway/token subset after final test edits | 58 passed, 2 files | Local Vitest. |
| ESLint | Passed | Local project. |
| Next production build including TypeScript | Passed | Generated disposable configuration; no production credentials. |
| Patch whitespace | Passed | `git diff --check`. |
| Full provider/browser suite for these changes | Pending | Requires isolated Docker services and Chromium in the retained P2 workflow. |
| Production deployment or authenticated production test | Not performed | Neither platform activation nor data migration is part of this review. |

The original P2 CI failures inspected were
[unit CI 34762134979](https://github.com/RadimStud/tinytools/actions/runs/34762134979)
and [provider CI 34762134978](https://github.com/RadimStud/tinytools/actions/runs/34762134978).
The latter reported 19 passed and one failed test. The failing vault assertion
used a browser session invalidated by the preceding real password recovery.
Those earlier results do not establish that this revision passes provider CI.

A standalone `tsc --noEmit` before Next type generation reported missing
`LayoutProps`. The complete Next build generated its route types and passed
TypeScript; no application types or checks were weakened.

The owner explicitly authorized publication of this branch and creation of its
PR after the initial automatic approval rejection. Publication and provider CI
are being completed against the verified `RadimStud/tinytools` repository. The
original P2 branch is unchanged by this follow-up.

## Handoff to the parallel ORION work

The implemented browser prefix is `/api/apps/orion`, with the current supported
routes below. This is the P2 diagnostic contract; it does not yet route the six
assistants' application operations.

| Browser route | Fixed service route | Current purpose |
| --- | --- | --- |
| `GET /api/apps/orion/v1/context` | `GET /v1/context` | Verified account and current policy. |
| `POST /api/apps/orion/v1/jobs` | `POST /v1/jobs` | Create an account-owned `contract.echo` job. |
| `GET /api/apps/orion/v1/jobs/{jobId}` | `GET /v1/jobs/{jobId}` | Read the requested account-owned job. |
| `POST /api/apps/orion/v1/jobs/{jobId}/run` | `POST /v1/jobs/{jobId}/run` | Execute diagnostic work after live authorization. |

Use [orion-v1.openapi.yaml](orion-v1.openapi.yaml) and the existing signer/verifier
implementation for the exact ES256 assertion, request binding, session identity,
replay requirements, idempotency, limits and internal execution authorization.
The informational P1 app-access response remains insufficient for service
authorization.

The gateway continues to require explicit `contract-test` mode and a
nonproduction environment, and refuses `VERCEL_ENV=production`. Paid operations
remain disabled. This review does not remove that gate, supply a Python adapter,
or certify shared public ORION accounts. A Vercel adaptation needs to satisfy
the application's user isolation and persistent storage requirements before
changing those deployment gates. Keep the existing owner data separate from
new account workspaces.

The current production `/superuser/orion` launch page is a separate change on
`main` (`8cedd9b5`). Retain it when integrating the stacked #4 / #5 / #6 changes;
this review branch does not replace it. Coordinate the final `/orion` interface
and runtime adaptation with the ORION thread.

## Next action

Publish this branch and open a draft PR against `feature/platform-p2-gateway`.
Run the retained P2 workflow, which uses disposable
GoTrue, PostgreSQL, Mailpit and S3-compatible storage, and inspect all results.
Resolve any remaining failures before treating P2 acceptance as complete or
issuing the final `ORION_PLATFORM_HANDOFF.md`. Then integrate the changes through
the existing P1/P2 stack and the parallel ORION implementation.
