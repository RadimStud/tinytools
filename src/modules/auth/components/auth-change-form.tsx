"use client";
import type { ReactNode } from "react";
import { announceSessionChange } from "./session-events";

export function AuthChangeForm({ action, children, className }: {
  action: (data: FormData) => void | Promise<void>; children: ReactNode; className?: string;
}) {
  return <form action={action} className={className} onSubmit={() => announceSessionChange("pending")}>{children}</form>;
}
