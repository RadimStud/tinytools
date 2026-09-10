export function requireE2ECredentials() {
  const email =
    process.env.E2E_EMAIL?.trim();

  const password =
    process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Authenticated E2E smoke tests require E2E_EMAIL and E2E_PASSWORD. They have no defaults. Set both in the environment (or .env.e2e) before running npm run test:e2e:production.",
    );
  }

  return {
    email,
    password,
  };
}
