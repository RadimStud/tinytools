import fs from "node:fs";
import postgres from "postgres";
import type { FullResult, Reporter, TestCase, TestResult, TestStep } from "@playwright/test/reporter";

/** Only counts, fixed route names and status codes leave this disposable environment. */
export default class StatusReporter implements Reporter {
  private rows: { title: string; status: string; duration_ms: number }[] = [];
  private diagnostics: string[] = [];
  onStdErr(chunk: string | Buffer) {
    const codes = String(chunk).match(/P2_(?:AUTH_(?:STATUS_\d{3}_[A-Za-z0-9_]+|TRACE_[a-z_]+_\d{3}_[A-Z]+|TRANSPORT_FAILURE)|CHECK_[A-Z_0-9]+)/g);
    if (codes) for (const code of codes) this.diagnostics.push(code);
    const categories = String(chunk).match(/Platform failure category: [0-9A-Z_]+/g);
    if (categories) this.diagnostics.push(...categories);
    if (String(chunk).includes("Authentication callback failed.")) this.diagnostics.push("Callback threw a redacted error");
  }
  onStepEnd(_test: TestCase, _result: TestResult, step: TestStep) {
    if (step.error && step.location) this.diagnostics.push(`Failed step: ${step.category} ${step.location.file.split("/").slice(-2).join("/")}:${step.location.line}`);
  }
  onTestEnd(test: TestCase, result: TestResult) {
    this.rows.push({ title: test.title, status: result.status, duration_ms: result.duration });
    console.log(`${result.status}: ${test.title}`);
    if (result.status !== "passed" && result.status !== "skipped") {
      for (const error of result.errors) {
        if (error.location) this.diagnostics.push(`Failure location: ${error.location.file.split("/").slice(-2).join("/")}:${error.location.line}`);
        const urls = String(error.message ?? "").replaceAll(String.fromCharCode(27), " ").match(/https?:\/\/[^\s"'<>]+/g) ?? [];
        for (const value of urls) {
          try {
            const u = new URL(value);
            if (["/apps", "/login", "/signup", "/auth/callback", "/auth/complete", "/account/password"].includes(u.pathname)) this.diagnostics.push("Observed assertion page: " + u.pathname);
          } catch { /* Never print the original error. */ }
        }
      }
    }
  }
  async onEnd(result: FullResult) {
    if (result.status !== "passed") {
      const config = JSON.parse(fs.readFileSync(".p2-local/test.json", "utf8"));
      const url = new URL(config.DATABASE_URL);
      if (url.hostname === "127.0.0.1" && url.port === "54329" && url.pathname === "/minikit_platform_e2e") {
        const sql = postgres(url.toString(), { max: 1, connect_timeout: 5 });
        try {
          const counts = await sql`SELECT (SELECT count(*)::int FROM auth.users) AS registered, (SELECT count(*)::int FROM auth.users WHERE email_confirmed_at IS NOT NULL) AS confirmed, (SELECT count(*)::int FROM auth.sessions) AS sessions, (SELECT count(*)::int FROM public.users) AS mapped, (SELECT count(*)::int FROM public.app_access) AS grants, (SELECT count(*)::int FROM public.tools) AS tools, (SELECT count(*)::int FROM public.tool_versions WHERE file_key IS NOT NULL) AS uploaded_versions`;
          this.diagnostics.push("Disposable provider counts: " + JSON.stringify(counts[0]));
        } catch { this.diagnostics.push("Disposable counts unavailable"); }
        finally { await sql.end(); }
      }
    }
    fs.mkdirSync("playwright-report/platform-full", { recursive: true });
    const counts = Object.fromEntries(["passed", "failed", "skipped", "timedOut", "interrupted"].map(s => [s, this.rows.filter(r => r.status === s).length]));
    fs.writeFileSync("playwright-report/platform-full/results.json", JSON.stringify({ status: result.status, counts, tests: this.rows, diagnostics: this.diagnostics }, null, 2));
    for (const line of this.diagnostics) console.log(line);
    console.log(`Isolated provider result: ${result.status}; ${JSON.stringify(counts)}`);
  }
}
