import fs from "node:fs";
import type { FullResult, Reporter, TestCase, TestResult } from "@playwright/test/reporter";

/** Do not serialize test steps, arguments, traces or verification links. */
export default class StatusReporter implements Reporter {
  private rows: { title: string; status: string; duration_ms: number }[] = [];
  onTestEnd(test: TestCase, result: TestResult) {
    this.rows.push({ title: test.title, status: result.status, duration_ms: result.duration });
    console.log(`${result.status}: ${test.title}`);
    if (result.status !== "passed" && result.status !== "skipped") {
      // A location is sufficient to locate an assertion without printing secrets.
      for (const error of result.errors) {
        if (error.location) console.log(`Failure location: ${error.location.file.split("/").slice(-2).join("/")}:${error.location.line}`);
      }
    }
  }
  onEnd(result: FullResult) {
    fs.mkdirSync("playwright-report/platform-full", { recursive: true });
    const counts = Object.fromEntries(["passed", "failed", "skipped", "timedOut", "interrupted"].map(s => [s, this.rows.filter(r => r.status === s).length]));
    fs.writeFileSync("playwright-report/platform-full/results.json", JSON.stringify({ status: result.status, counts, tests: this.rows }, null, 2));
    console.log(`Isolated provider result: ${result.status}; ${JSON.stringify(counts)}`);
  }
}
