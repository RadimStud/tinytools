import { redirect } from "next/navigation";
import { SessionTransition } from "@/modules/auth/components/session-transition";
import { authLandingPath, safeReturnPath } from "@/modules/auth/domain/return-path";
export const dynamic = "force-dynamic";
export const metadata = { title: "Updating session", robots: { index: false, follow: false } };
export default async function AuthComplete({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeReturnPath((await searchParams).next, authLandingPath());
  if (process.env.MINIKIT_PLATFORM_ENABLED !== "1") redirect(next);
  return <SessionTransition next={next} />;
}
