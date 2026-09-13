"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SESSION_CHANNEL, SESSION_DOM_EVENT, SESSION_STORAGE_EVENT, sessionPhase, type SessionPhase } from "./session-events";

/** Display isolation is supplementary to server authorization, never a substitute for it. */
export function SessionBoundary({ subject, children }: { subject: string; children: ReactNode }) {
  const [status, setStatus] = useState<"checking" | "ready" | "submitting" | "unavailable">("checking");
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let alive = true;
    let generation = 0;
    let controller: AbortController | undefined;
    let navigating = false;
    let waitingForChange = false;
    const seenEvents = new Set<string>();
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
      // Preserve the submitting form until React dispatches its server action.
      // Its contents stay hidden, with a recovery control if the action fails.
      setStatus(submittingHere ? "submitting" : "unavailable");
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
    const consume = (value: unknown, local = false) => {
      const phase = sessionPhase(value);
      if (!phase) return;
      const nonce = (value as { nonce?: unknown }).nonce;
      // Separate BroadcastChannel instances in the SAME window also communicate.
      // Process each hint once, preserving the local submitting form's lifetime.
      if (typeof nonce === "string" && nonce.length <= 80) {
        const key = `${phase}:${nonce}`;
        if (seenEvents.has(key)) return;
        seenEvents.add(key);
        if (seenEvents.size > 32) seenEvents.delete(seenEvents.values().next().value!);
      }
      invalidate(phase, local && phase === "pending");
    };
    const message = (event: MessageEvent) => consume(event.data);
    const localMessage = (event: Event) => consume((event as CustomEvent).detail, true);
    const stored = (event: StorageEvent) => {
      if (event.key !== SESSION_STORAGE_EVENT || !event.newValue) return;
      try { consume(JSON.parse(event.newValue)); } catch { /* Ignore malformed hints. */ }
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
      <p role="status">{status === "checking" ? "Checking your session…" : status === "submitting"
        ? "Updating your session. Private content is hidden until this completes."
        : "Your session changed or could not be verified. Private content has been cleared."}</p>
      {(status === "unavailable" || status === "submitting") && <button className="mt-5 rounded-lg border border-neutral-600 px-4 py-3" onClick={() => location.reload()}>Reload securely</button>}
    </section>}
    <div ref={panel} hidden={status !== "ready"}>{status === "ready" || status === "submitting" ? children : null}</div>
  </>;
}
