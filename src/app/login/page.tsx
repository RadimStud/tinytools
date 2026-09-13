import { AccountEntry } from "@/modules/auth/components/account-entry";
export const dynamic = "force-dynamic";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  return <AccountEntry mode="login" searchParams={searchParams} />;
}
