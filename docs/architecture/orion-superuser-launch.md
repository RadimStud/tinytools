# ORION web entry for the existing superuser

The dashboard and private vault link to `/superuser/orion`. This dynamic server
page calls the existing `services.vault.requireUser()` permission check on every
visit. Being a Market admin alone does not grant access. Anonymous visitors go to
`/login`; signed-in users without superuser permission go to `/dashboard`.

Set **ORION_WEB_URL** in the MiniKit hosting environment to the actual ORION
HTTPS origin, then redeploy MiniKit. The value must be a bare origin such as
`https://orion.example.com`, without credentials, path, query, or fragment. The
example is not a live deployment. Missing or invalid configuration displays an
explicit "not online yet" page after authorization. Visitor query parameters
cannot change the target. Links disable prefetch and the page is not indexed.

This is a launch link, not P2 single sign-on. ORION must retain its own access
password, HTTPS, session and CSRF checks. MiniKit does not forward its session,
passwords, identity, files, or tokens. Hiding the launch button does not secure the
external service; its existing single-owner authentication remains mandatory.

## Deployment

1. Deploy the private `RadimStud/ORION` repository as its own Flask project in the
   **existing Vercel account**. Reuse the existing Supabase PostgreSQL database
   and private R2 bucket. The owner adapter, explicit database migration and
   environment instructions live in that repository's `docs/VERCEL_OWNER_WEB.md`.
   Do not copy private ORION source into this public repository.
2. Set ORION's exact HTTPS origin, separate random password (at least 24
   characters), server-selected owner Auth UUID and private database/storage
   credentials in its Vercel project. Add its origin to the existing R2 CORS
   rules while preserving MiniKit's rules. Preview uses a separate namespace
   and password. Do not put credentials in this URL or in MiniKit client code.
3. Verify sign-in, rejection of unauthenticated API calls, all six offline
   profiles, restart persistence, and direct R2 import/export above 4.5 MB before
   setting `ORION_WEB_URL`. Paid agent calls remain disabled until P2 exists.
4. Set that verified origin in MiniKit and redeploy. Confirm the button appears
   for the superuser and the direct entry is denied to a normal account.

The launch link does not itself deploy ORION or activate the separate P1/P2
branch. A successful ORION deployment and its verified HTTPS origin are still
required. The local Docker/desktop entrypoints remain independent; deployment
for this integration uses Vercel and the existing storage services.
