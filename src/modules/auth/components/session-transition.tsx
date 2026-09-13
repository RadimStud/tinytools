"use client";
import { useEffect } from "react";
import { announceSessionChange } from "./session-events";

export function SessionTransition({ next }: { next: string }) {
  useEffect(() => {
    announceSessionChange("committed");
    location.replace(next);
  }, [next]);
  return <main className="min-h-screen bg-neutral-950 px-6 py-12 text-neutral-100"><p role="status">Updating your session…</p><noscript><a href={next}>Continue</a></noscript></main>;
}
