/** Disposable test bootstrap. Does not load production dotenv files or print generated secrets. */
import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import postgres from "postgres";
import { CreateBucketCommand, S3Client } from "@aws-sdk/client-s3";

const root = fileURLToPath(new URL("../", import.meta.url));
process.chdir(root);
const privateDir = path.join(root, ".p2-local");
const action = process.argv[2];
const secret = () => randomBytes(32).toString("hex");
for (const file of [".env", ".env.local", ".env.production", ".env.production.local"]) {
  try { await fs.access(file); throw new Error("Run P2 tests in a clean worktree without provider dotenv files."); }
  catch (e) { if (e.code !== "ENOENT") throw e; }
}
async function child(file, args, env) {
  await new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [file, ...args], { stdio: "inherit", env });
    p.on("error", reject); p.on("exit", code => code === 0 ? resolve() : reject(new Error("Isolated command failed.")));
  });
}
if (action === "prepare") {
  try { await fs.access(privateDir); throw new Error("An isolated environment already exists. Stop and remove it explicitly before regenerating."); }
  catch (e) { if (e.code !== "ENOENT") throw e; }
  await fs.mkdir(privateDir, { mode: 0o700 });
  const db = secret(); const auth = secret(); const storageKey = "test" + randomBytes(8).toString("hex"); const storageSecret = secret();
  const pair = await generateKeyPair("ES256", { extractable: true });
  const meta = { kid: "isolated-" + randomBytes(6).toString("hex"), alg: "ES256", use: "sig" };
  const publicJwks = { keys: [{ ...await exportJWK(pair.publicKey), ...meta }] };
  const privateJwk = { ...await exportJWK(pair.privateKey), ...meta };
  const providerKey = async role => new SignJWT({ role, iss: "supabase", aud: "authenticated" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" }).setIssuedAt().setExpirationTime("2h").sign(new TextEncoder().encode(auth));
  const env = {
    DATABASE_URL: `postgresql://postgres:${db}@127.0.0.1:54329/minikit_platform_e2e`,
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: await providerKey("anon"),
    R2_ENDPOINT: "http://127.0.0.1:54327", R2_ACCESS_KEY_ID: storageKey,
    R2_SECRET_ACCESS_KEY: storageSecret, R2_BUCKET_NAME: "minikit-e2e", R2_REGION: "us-east-1",
    MINIKIT_PLATFORM_ENABLED: "1", MINIKIT_PLATFORM_ORIGIN: "http://127.0.0.1:3100",
    AUTH_ALLOWED_ORIGINS: "http://127.0.0.1:3100", MINIKIT_DEPLOYMENT_ENV: "isolated-test",
    MINIKIT_ORION_GATEWAY_MODE: "contract-test", ORION_INTERNAL_ORIGIN: "http://127.0.0.1:4201",
    MINIKIT_IDENTITY_ISSUER: "urn:minikit:platform:isolated-p2",
    MINIKIT_IDENTITY_PRIVATE_JWK: JSON.stringify(privateJwk),
    MINIKIT_IDENTITY_PUBLIC_JWKS: JSON.stringify(publicJwks), ORION_SERVICE_CREDENTIAL: secret(),
  };
  await fs.writeFile(path.join(privateDir, "app.json"), JSON.stringify(env), { mode: 0o600 });
  await fs.writeFile(path.join(privateDir, "test.json"), JSON.stringify({ ...env, TEST_SERVICE_ROLE_KEY: await providerKey("service_role") }), { mode: 0o600 });
  await fs.writeFile(path.join(privateDir, "docker.env"), `P2_DB_PASSWORD=${db}\nP2_AUTH_SECRET=${auth}\nP2_STORAGE_KEY=${storageKey}\nP2_STORAGE_SECRET=${storageSecret}\n`, { mode: 0o600 });
  console.log("Generated disposable local-only credentials. No production configuration was read.");
} else {
  const env = { ...process.env, ...JSON.parse(await fs.readFile(path.join(privateDir, "app.json"), "utf8")), NEXT_TELEMETRY_DISABLED: "1" };
  delete env.VERCEL_ENV;
  const target = new URL(env.DATABASE_URL);
  if (target.hostname !== "127.0.0.1" || target.port !== "54329" || target.pathname !== "/minikit_platform_e2e") throw new Error("Not the isolated database.");
  if (action === "seed") {
    await child("node_modules/drizzle-kit/bin.cjs", ["push", "--force"], env);
    const sql = postgres(env.DATABASE_URL, { max: 1, prepare: false });
    try {
      // Schema is generated from the actual production models; do not use the reduced P1 fixture.
      await sql.begin(async tx => {
        for (const file of ["0001_explicit_current_release.sql", "0004_platform_accounts.sql", "0005_gateway_rate_windows.sql"]) {
          await tx.unsafe(await fs.readFile(path.join("drizzle", file), "utf8"));
        }
      });
    } finally { await sql.end(); }
    const s3 = new S3Client({ endpoint: env.R2_ENDPOINT, region: env.R2_REGION, forcePathStyle: true,
      credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY } });
    await s3.send(new CreateBucketCommand({ Bucket: env.R2_BUCKET_NAME })); s3.destroy();
    console.log("Isolated full schema and S3 bucket initialized; no user has been promoted.");
  } else if (action === "build") {
    await child("node_modules/next/dist/bin/next", ["build"], env);
  } else if (action === "serve") {
    await child("node_modules/tsx/dist/cli.mjs", ["tests/platform-full/serve.ts"], env);
  } else throw new Error("Use prepare, seed, build or serve.");
}
