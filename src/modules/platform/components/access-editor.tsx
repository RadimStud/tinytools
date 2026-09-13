"use client";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppAccess, PlatformApp } from "../domain/platform";

export function AccessEditor({ subject, app, grant }: { subject: string; app: PlatformApp; grant?: AppAccess }) {
  const router = useRouter();
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return <form aria-label={`Access to ${app.name}`} className="rounded-xl border border-neutral-700 p-5" onSubmit={async event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/platform/v1/admin/access", {
        method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, app_id: app.app_id, status: form.get("status"), app_role: form.get("app_role"), expected_policy_version: grant?.policy_version ?? 0, reason: form.get("reason") }),
      });
      const result = await response.json();
      if (!response.ok) {
        const code = typeof result.error?.code === "string" ? result.error.code : "operation_failed";
        setMessage(code === "policy_conflict" ? "Access changed in another request. Reload before retrying." : `Change rejected: ${code}.`);
        return;
      }
      setMessage("Access updated and audited."); router.refresh();
    } catch { setMessage("Change could not be confirmed. Reload before retrying."); }
    finally { setBusy(false); }
  }}>
    <h3 className="text-lg font-medium">{app.name}</h3><p className="mt-2 text-sm text-neutral-400">Current policy version: {grant?.policy_version ?? 0}. {app.state === "coming_soon" ? "This application remains unavailable even with an enabled grant." : ""}</p>
    <fieldset disabled={busy} className="mt-5 grid gap-4 sm:grid-cols-2"><legend className="sr-only">Application access settings</legend>
      <div className="text-sm"><label htmlFor={`${id}-status`}>Access</label><select id={`${id}-status`} name="status" defaultValue={grant?.status ?? "revoked"} className="mt-2 block w-full rounded-lg border border-neutral-700 bg-neutral-950 p-3"><option value="enabled">Enabled</option><option value="suspended">Suspended</option><option value="revoked">Revoked</option></select></div>
      <div className="text-sm"><label htmlFor={`${id}-role`}>Application role</label><select id={`${id}-role`} name="app_role" defaultValue={grant?.app_role ?? "user"} className="mt-2 block w-full rounded-lg border border-neutral-700 bg-neutral-950 p-3"><option value="user">User</option><option value="app_admin">Application administrator</option></select></div>
      <label className="text-sm sm:col-span-2">Reason (no private data)<input name="reason" required minLength={5} maxLength={500} className="mt-2 block w-full rounded-lg border border-neutral-700 bg-neutral-950 p-3" /></label>
      <button className="rounded-lg bg-neutral-100 px-4 py-3 text-neutral-950">{busy ? "Saving…" : "Save access"}</button>
    </fieldset>{message && <p role="status" className="mt-4 text-sm">{message}</p>}
  </form>;
}
