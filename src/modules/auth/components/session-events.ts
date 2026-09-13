export const SESSION_CHANNEL = "minikit-session-v1";
export const SESSION_STORAGE_EVENT = "minikit:session-event:v1";
export const SESSION_DOM_EVENT = "minikit:session-change";
export type SessionPhase = "pending" | "committed";

export function sessionPhase(value: unknown): SessionPhase | null {
  if (!value || typeof value !== "object") return null;
  const event = value as Record<string, unknown>;
  return event.type === "session-change" && event.version === 1 &&
    (event.phase === "pending" || event.phase === "committed") ? event.phase : null;
}

/** Invalidation only. No user identifier, cookie, token or private content crosses this channel. */
export function announceSessionChange(phase: SessionPhase) {
  const event = { type: "session-change", version: 1, phase, nonce: crypto.randomUUID() };
  window.dispatchEvent(new CustomEvent(SESSION_DOM_EVENT, { detail: event }));
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(SESSION_CHANNEL);
    channel.postMessage(event);
    channel.close();
  }
  try {
    localStorage.setItem(SESSION_STORAGE_EVENT, JSON.stringify(event));
    localStorage.removeItem(SESSION_STORAGE_EVENT);
  } catch { /* Focus/poll verification still works when storage is unavailable. */ }
}
