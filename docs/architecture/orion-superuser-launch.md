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

1. Deploy `RadimStud/ORION` using its existing Docker image, one running instance,
   and persistent storage at `/app/data`. Use a fresh volume for this web instance.
2. Set a random `ORION_WEB_PASSWORD` of at least 16 characters and
   `ORION_WEB_ORIGIN` to the actual HTTPS origin. Keep credentials in the host's
   secret settings. Do not put the password in this URL or in MiniKit.
3. Verify `/health`, the login screen, rejection of unauthenticated API calls,
   and authenticated use of the assistant before setting `ORION_WEB_URL`.
4. Set that verified origin in MiniKit and redeploy. Confirm the button appears
   for the superuser and the direct entry is denied to a normal account.

This change does not deploy a Python server, configure a hosting account, or
activate the separate platform P1/P2 branch. Actual ORION hosting is a required
deployment step. The existing ORION `deploy/compose.yaml` supports a server with
Docker and Caddy; a managed Docker host can run the same image with persistent
storage and its HTTPS proxy.
