import { createServer } from "node:http";
import { spawn } from "node:child_process";

if (process.env.MINIKIT_DEPLOYMENT_ENV !== "isolated-test" || process.env.NEXT_PUBLIC_SUPABASE_URL !== "http://127.0.0.1:54321") throw new Error("Isolated test adapter only.");
// Local provider ingress translates the Supabase /auth/v1 prefix. It does not authenticate or mint sessions.
const proxy = createServer(async (req, res) => {
  if (!req.url?.startsWith("/auth/v1/")) { res.writeHead(404); res.end(); return; }
  try {
    const buffers: Buffer[] = []; let size = 0;
    for await (const data of req) { size += data.length; if (size > 32768) throw new Error(); buffers.push(data); }
    const h = new Headers();
    for (const name of ["authorization", "apikey", "content-type", "x-client-info", "x-supabase-api-version"]) {
      const value = req.headers[name]; if (typeof value === "string") h.set(name, value);
    }
    const out = await fetch("http://127.0.0.1:54326" + req.url.slice("/auth/v1".length), {
      method: req.method, headers: h, body: buffers.length ? Buffer.concat(buffers) : undefined, redirect: "manual", signal: AbortSignal.timeout(8000),
    });
    const result = Buffer.from(await out.arrayBuffer());
    if (!out.ok && out.status >= 400) {
      try {
        const payload = JSON.parse(result.toString("utf8"));
        const code = String(payload.error_code ?? payload.code ?? "unknown");
        console.error("Local Auth ingress failure", out.status, /^[a-z0-9_]{1,80}$/i.test(code) ? code : "unknown");
      } catch { console.error("Local Auth ingress failure", out.status); }
    }
    for (const name of ["content-type", "location", "cache-control"]) { const v = out.headers.get(name); if (v) res.setHeader(name, v); }
    res.writeHead(out.status); res.end(result);
  } catch { console.error("Local Auth transport failure"); res.writeHead(503); res.end(); }
});
proxy.listen(54321, "127.0.0.1");
const children = [
  spawn(process.execPath, ["node_modules/tsx/dist/cli.mjs", "tests/platform-full/orion-service.ts"], { stdio: "inherit", env: process.env }),
  spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3100"], { stdio: "inherit", env: process.env }),
];
function stop() { for (const c of children) c.kill("SIGTERM"); proxy.close(); }
process.on("SIGTERM", stop); process.on("SIGINT", stop);
for (const child of children) child.on("exit", code => { if (code) { stop(); process.exitCode = code; } });
