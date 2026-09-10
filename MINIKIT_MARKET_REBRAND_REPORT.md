# MiniKit Market rebrand report

## Summary

User-facing product name is now **MiniKit Market** (short brand **MiniKit**). This was a branding pass only. URLs, slugs, auth, repositories, services, database, R2, and the GitHub repo name `tinytools` are unchanged.

## Visible branding changed

| Surface | Before | After |
| --- | --- | --- |
| Homepage nav | TinyTools | MiniKit Market |
| Homepage hero | “Small software…” / “Find the tiny tool…” | Tagline **Small tools. Specific problems.**, H1 **MiniKit Market**, supporting marketplace sentence |
| Catalog subtitle | Initial TinyTools catalog | Initial MiniKit Market catalog |
| Search / login / signup / request back links | ← TinyTools | ← MiniKit Market |
| Signup copy | TinyTools developer account | MiniKit Market developer account |
| Check-email | redirected back to TinyTools | MiniKit Market |
| Request / publish success | stored in / Back to TinyTools | MiniKit Market |
| Dashboard nav | TinyTools | MiniKit Market |
| Dashboard empty state | first TinyTools draft | first MiniKit Market draft |
| Admin chrome | TinyTools Admin, Back to TinyTools | MiniKit Market Admin, Back to MiniKit Market (INTERNAL kept) |
| Fallback display name | TinyTools user | MiniKit user |
| Playwright public assertion | exact `TinyTools` | exact `MiniKit Market` |
| Playwright smoke form copy | TinyTools in descriptions | MiniKit Market |

No footer existed; none was added.

## Metadata changes

`src/app/layout.tsx`:

- `title.default`: MiniKit Market
- `title.template`: `%s | MiniKit Market`
- `description`: A marketplace for small, focused software tools that solve specific problems.
- Open Graph: title, description, `siteName` MiniKit Market, type website
- **No** canonical / `og:url` for minikitmarket.com

Admin layout uses `title.absolute`: MiniKit Market Admin (avoids “MiniKit Market Admin | MiniKit Market”).

## Files changed

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/search/page.tsx`
- `src/app/login/page.tsx`
- `src/app/signup/page.tsx`
- `src/app/signup/check-email/page.tsx`
- `src/app/request/page.tsx`
- `src/app/request/success/page.tsx`
- `src/app/publish/success/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/admin/layout.tsx`
- `src/modules/auth/services/auth-service.ts` (visible fallback display name only)
- `docs/architecture/releases.md` (current product docs)
- `README.md`
- `tests/e2e/public.spec.ts`
- `tests/e2e/production-smoke.spec.ts`
- `MINIKIT_MARKET_REBRAND_REPORT.md` (this file)

## Intentionally retained TinyTools / tinytools identifiers

### Internal technical identifiers

- `package.json` / `package-lock.json` `"name": "tinytools"`
- GitHub repository name `tinytools` (out of repo)
- `src/app/api/health/route.ts` `service: "tinytools"`
- `src/app/api/db-health/route.ts` `"tinytools-database"`
- `.github/workflows/ci.yml` dummy `DATABASE_URL` db name `tinytools`, `R2_BUCKET_NAME: tinytools-ci`
- `.github/workflows/production-smoke.yml` `E2E_BASE_URL=https://tinytools-ten.vercel.app` (current Vercel host)
- Table/column names, migrations, env var names, R2 key prefixes (`tools/...`), Supabase project config

### Historical documentation

- `CURSOR_IMPLEMENTATION_REPORT.md`
- `ADMIN_MVP_IMPLEMENTATION_REPORT.md`
- `E2E_SMOKE_IMPLEMENTATION_REPORT.md` (including recorded Vercel URL)

### Test fixture payload (not UI chrome)

- `tests/e2e/fixtures/smoke-file.txt` still contains “TinyTools automated production smoke test.” Changing it would alter the exact download bytes without being a UI brand string. Left as a deterministic fixture.

README still **mentions** `tinytools` to document the legacy repo/host name, not as the product brand.

## Infrastructure / domain still required later for minikitmarket.com

1. DNS and domain on Vercel (or equivalent) for `minikitmarket.com`
2. Set canonical / Open Graph URLs only after DNS is live
3. Supabase Auth redirect URLs / site URL for the new domain
4. Optional rename of Vercel project, R2 bucket, GitHub repo (not required for this branding pass)
5. Update `E2E_BASE_URL` in production-smoke workflow when the public hostname changes

Auth implementation and callback routes were not changed.

## Validation

- `npm run lint`: PASS
- `npm test`: PASS (26)
- `npm run build`: PASS
