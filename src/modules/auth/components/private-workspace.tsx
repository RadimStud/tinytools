import "server-only";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { SessionBoundary } from "./session-boundary";
import { AuthChangeForm } from "./auth-change-form";
import { safeReturnPath } from "../domain/return-path";
import { logout } from "@/app/auth/actions";

export async function PrivateWorkspace({ children, returnTo }: { children: ReactNode; returnTo: string }) {
  // Existing routes remain unchanged until a deliberate platform activation.
  if (process.env.MINIKIT_PLATFORM_ENABLED !== "1") return <>{children}</>;
  const { services } = await import("@/server/services");
  const user = await services.auth.getAuthenticatedUser();
  if (!user) redirect(`/login?${new URLSearchParams({ next: safeReturnPath(returnTo) })}`);
  return <SessionBoundary key={user.id} subject={user.id}>
    <nav aria-label="MiniKit account" className="flex flex-wrap items-center gap-5 border-b border-neutral-800 bg-neutral-950 px-6 py-4 text-sm text-neutral-200">
      <Link href="/dashboard" prefetch={false}>Market</Link><Link href="/apps" prefetch={false}>My apps</Link><Link href="/account" prefetch={false}>Account</Link>
      <AuthChangeForm action={logout}><button className="rounded-lg border border-neutral-700 px-3 py-2" type="submit">Sign out everywhere</button></AuthChangeForm>
    </nav>{children}
  </SessionBoundary>;
}
