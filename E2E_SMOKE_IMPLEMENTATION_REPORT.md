# TinyTools E2E Smoke Implementation Report

## Summary

Playwright now covers:

1. Unauthenticated public pages (`tests/e2e/public.spec.ts`)
2. A real authenticated marketplace smoke path (`tests/e2e/production-smoke.spec.ts`) including R2 upload/download

Vitest (`npm test`) is unchanged. Push/PR CI still runs lint, Vitest, and build only. Production-mutating smoke is `workflow_dispatch` only.

## Files

| Path | Purpose |
| --- | --- |
| `package.json` | `test:e2e`, `test:e2e:headed`, `test:e2e:production`; `@playwright/test` |
| `playwright.config.ts` | Chromium, `E2E_BASE_URL` / localhost fallback, traces/screenshots/video on failure, 180s timeout, 1 worker |
| `tests/e2e/fixtures/smoke-file.txt` | Deterministic upload/download payload |
| `tests/e2e/helpers/credentials.ts` | Fail fast if `E2E_EMAIL` / `E2E_PASSWORD` missing; no defaults |
| `tests/e2e/public.spec.ts` | Homepage, search, `/admin` and `/dashboard` → `/login` |
| `tests/e2e/production-smoke.spec.ts` | Login → draft → version → real R2 PUT → current release → publish → public download → archive |
| `.github/workflows/production-smoke.yml` | Manual GitHub Action using secrets |
| `.env.example` | `E2E_*` names only |
| `README.md` | Local and production PowerShell examples |
| `.gitignore` | `test-results/`, `playwright-report/` |

Minimal UI locator support (not business-logic changes):

- Dashboard tool cards: `aria-label={tool.name}` on existing `<article>`
- Version rows: `<article aria-label="Version {version}">`
- Tool status: `aria-label="Status {status}"`
- Current release block: `aria-label="Current release details"`

No `data-testid` attributes were added.

## Credentials

Required for authenticated smoke only:

- `E2E_BASE_URL` (optional; defaults to `http://localhost:3000`)
- `E2E_EMAIL` (required, no default)
- `E2E_PASSWORD` (required, no default)

Playwright also loads `.env.e2e` then `.env.local` via dotenv **without overriding** already-set process env. Those files stay gitignored.

## Smoke flow notes

Publish still requires a full description (≥ 20 characters). The E2E fills **Full description** and **Save changes** on the management page so the existing service rule is exercised, not bypassed.

Cleanup uses `try/finally` and archives **only** the management URL opened for the unique `E2E Smoke <timestamp>` tool.

Upload uses the real **Choose file** input and **Upload binary** button (presigned PUT). Download uses Playwright’s `download` event against the public `/tools/[slug]/download` route.

## How to run

```powershell
npx playwright install chromium

# terminal 1
npm run dev

# terminal 2
$env:E2E_BASE_URL="http://localhost:3000"
$env:E2E_EMAIL="..."
$env:E2E_PASSWORD="..."
npm run test:e2e
```

Production:

```powershell
$env:E2E_BASE_URL="https://tinytools-ten.vercel.app"
$env:E2E_EMAIL="..."
$env:E2E_PASSWORD="..."
npm run test:e2e:production
```

## CI

- `.github/workflows/ci.yml` — unchanged: lint, `npm test`, build. No E2E secrets.
- `.github/workflows/production-smoke.yml` — `workflow_dispatch` only; `E2E_BASE_URL=https://tinytools-ten.vercel.app`; secrets `E2E_EMAIL`, `E2E_PASSWORD`.

## Validation

Ran in this implementation turn:

- `npm run lint` — PASS
- `npm test` — PASS (26 Vitest tests)
- `npm run build` — PASS
- `npx playwright install chromium` — PASS
- `npx playwright test tests/e2e/public.spec.ts` against `https://tinytools-ten.vercel.app` — PASS (4 tests)
- `npx playwright test tests/e2e/production-smoke.spec.ts` — FAIL as designed: this environment has no `E2E_EMAIL` / `E2E_PASSWORD`. The spec throws the configuration error immediately and does not mutate production.

After you set credentials locally, re-run `npm run test:e2e:production`.
