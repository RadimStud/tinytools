// Test-only harness. Not an application route or authentication bypass.
// Browser tests intercept all fixture identity/action requests; no provider or AI calls.
import { createRoot } from "react-dom/client";
import { useState } from "react";
import { SessionBoundary } from "../../../src/modules/auth/components/session-boundary";
import { AuthChangeForm } from "../../../src/modules/auth/components/auth-change-form";
import { announceSessionChange } from "../../../src/modules/auth/components/session-events";
function Workspace() {
  const [draft, setDraft] = useState("Synthetic private draft A");
  return <section><h1>Private A workspace</h1><label>Private draft<textarea value={draft} onChange={event => setDraft(event.target.value)} /></label>
    <AuthChangeForm action={async () => { await fetch("/fixture/action", { method: "POST" }); }}>
      <button type="submit">Change session locally</button>
    </AuthChangeForm>
  </section>;
}
function Fixture() {
  if (location.pathname.startsWith("/login")) return <main><h1>Sign in fixture</h1><p>No private workspace is mounted.</p></main>;
  if (new URLSearchParams(location.search).has("control")) return <main><h1>Auth change fixture</h1><button onClick={() => announceSessionChange("pending")}>Begin auth change</button><button onClick={() => announceSessionChange("committed")}>Commit auth change</button></main>;
  return <SessionBoundary subject="11111111-1111-4111-8111-111111111111"><Workspace /></SessionBoundary>;
}
createRoot(document.getElementById("root")!).render(<Fixture />);
