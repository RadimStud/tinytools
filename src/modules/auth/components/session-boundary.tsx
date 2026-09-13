"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SESSION_CHANNEL, SESSION_DOM_EVENT, SESSION_STORAGE_EVENT, sessionPhase, type SessionPhase } from "./session-events";

/** Display isolation is supplementary to server authorization, never a substitute for it. */
export function SessionBoundary({ subject, children }: { subject: string; children: ReactNode }) {
  const [status, setStatus] = useState<"checking" | "ready" | "unavailable">("checking");
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let alive = true;
    let generation = 0;
    let controller: AbortController | undefined;
    let navigating = false;
    let waitingForChange = false;
    const hide = () => { if (panel.current) panel.current.hidden = true; };
    const navigate = () => {
      if (navigating) return;
      navigating = true;
      // Full navigation discards stale router, React and in-memory workspace state.
      const next = location.pathname + location.search;
      location.replace(`/login?${new URLSearchParams({ next })}`);
    };
    const invalidate = (phase: SessionPhase, submittingHere = false) => {
      generation++; controller?.abort(); hide(); waitingForChange = true;
      // A submitting form must remain mounted until React starts its server action.
      // Its contents are hidden synchronously; the completion performs a full navigation.
      if (!submittingHere) setStatus("unavailable");
      window.dispatchEvent(new Event("minikit:private-state-invalidated"));
      if (phase === "committed") navigate();
    };
    const verify = async () => {
      if (navigating || waitingForChange || !alive) return;
      const current = ++generation;
      controller?.abort();
      const activeController = new AbortController();
      controller = activeController;
      hide();
      const timeout = setTimeout(() => activeController.abort(), 5000);
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store", credentials: "same-origin", signal: activeController.signal,
          headers: { Accept: "application/json" },
        });
        if (!alive || current !== generation) return;
        if (response.status === 401) { invalidate("committed"); return; }
        if (!response.ok) throw new Error("session_unavailable");
        const body = await response.json() as { data?: { subject?: unknown } };
        if (!alive || current !== generation) return;
        if (typeof body.data?.subject !== "string") throw new Error("session_unavailable");
        if (body.data.subject !== subject) { invalidate("committed"); return; }
        if (panel.current) panel.current.hidden = false;
        setStatus("ready");
      } catch {
        if (alive && current === generation) { hide(); setStatus("unavailable"); }
      } finally { clearTimeout(timeout); }
    };
    const message = (event: MessageEvent) => { const phase = sessionPhase(event.data); if (phase) invalidate(phase); };
    const localMessage = (event: Event) => { const phase = sessionPhase((event as CustomEvent).detail); if (phase) invalidate(phase, phase === "pending"); };
    const stored = (event: StorageEvent) => {
      if (event.key !== SESSION_STORAGE_EVENT || !event.newValue) return;
      try { const phase = sessionPhase(JSON.parse(event.newValue)); if (phase) invalidate(phase); } catch { /* Ignore malformed hints. */ }
    };
    const focus = () => { if (document.visibilityState === "visible") void verify(); };
    const pageHide = () => { generation++; controller?.abort(); hide(); };
    const pageShow = () => { void verify(); };
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(SESSION_CHANNEL) : null;
    channel?.addEventListener("message", message);
    window.addEventListener(SESSION_DOM_EVENT, localMessage);
    window.addEventListener("storage", stored); window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    window.addEventListener("pagehide", pageHide); window.addEventListener("pageshow", pageShow);
    const interval = setInterval(focus, 30_000);
    void verify();
    return () => {
      alive = false; generation++; controller?.abort(); clearInterval(interval); channel?.close();
      window.removeEventListener(SESSION_DOM_EVENT, localMessage);
      window.removeEventListener("storage", stored); window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", focus);
      window.removeEventListener("pagehide", pageHide); window.removeEventListener("pageshow", pageShow);
    };
  }, [subject]);
  return <>
    {status !== "ready" && <section aria-label="Session verification" className="min-h-screen bg-neutral-950 px-6 py-12 text-neutral-100">
      <p role="status">{status === "checking" ? "Checking your session…" : "Your session changed or could not be verified. Private content has been cleared."}</p>
      {status === "unavailable" && <button className="mt-5 rounded-lg border border-neutral-600 px-4 py-3" onClick={() => location.reload()}>Reload securely</button>}
    </section>}
    <div ref={panel} hidden={status !== "ready"}>{status === "ready" ? children : null}</div>
  </>;
}
