import { AccountEntry } from "@/modules/auth/components/account-entry";
export const dynamic = "force-dynamic";
export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  return <AccountEntry mode="signup" searchParams={searchParams} />;
}
