import fs from "node:fs";
import type { FullResult, Reporter, TestCase, TestResult } from "@playwright/test/reporter";

/** Do not serialize test steps, arguments, traces, cookies or verification links. */
export default class StatusReporter implements Reporter {
  private rows: { title: string; status: string; duration_ms: number }[] = [];
  private diagnostics: string[] = [];
  onStdErr(chunk: string | Buffer) {
    const codes = String(chunk).match(/P2_AUTH_(?:STATUS_\d{3}_[A-Za-z0-9_]+|TRANSPORT_FAILURE)/g);
    if (codes) for (const code of codes) { this.diagnostics.push(code); console.log(code); }
  }
  onTestEnd(test: TestCase, result: TestResult) {
    this.rows.push({ title: test.title, status: result.status, duration_ms: result.duration });
    console.log(`${result.status}: ${test.title}`);
    if (result.status !== "passed" && result.status !== "skipped") {
      for (const error of result.errors) {
        if (error.location) this.diagnostics.push(`Failure location: ${error.location.file.split("/").slice(-2).join("/")}:${error.location.line}`);
        // Only report fixed page names; never persist the query, fragment or arbitrary path.
        const urls = String(error.message ?? "").match(/https?:\/\/[^\s"'<>]+/g) ?? [];
        for (const value of urls) {
          try {
            const path = new URL(value).pathname;
            if (["/apps", "/login", "/signup", "/auth/callback", "/auth/complete", "/account/password", "/auth/v1/verify"].includes(path)) {
              this.diagnostics.push("Observed assertion page: " + path);
            }
          } catch { /* Never print the original error. */ }
        }
      }
    }
  }
  onEnd(result: FullResult) {
    fs.mkdirSync("playwright-report/platform-full", { recursive: true });
    const counts = Object.fromEntries(["passed", "failed", "skipped", "timedOut", "interrupted"].map(s => [s, this.rows.filter(r => r.status === s).length]));
    fs.writeFileSync("playwright-report/platform-full/results.json", JSON.stringify({ status: result.status, counts, tests: this.rows, diagnostics: this.diagnostics }, null, 2));
    for (const line of this.diagnostics) console.log(line);
    console.log(`Isolated provider result: ${result.status}; ${JSON.stringify(counts)}`);
  }
}
