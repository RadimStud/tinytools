import { redirect } from "next/navigation";
import { services } from "@/server/services";
import { VaultError } from "@/modules/superuser/domain/vault";
import { VaultConsole } from "./vault-console";
import "./vault.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: { absolute: "MiniKit // Superuser" },
  robots: { index: false, follow: false },
};
export default async function SuperuserPage() {
  let files;
  try {
    files = await services.vault.list();
  } catch (error) {
    if (error instanceof VaultError) redirect(error.status === 401 ? "/login" : "/dashboard");
    throw error;
  }
  return <VaultConsole initialFiles={files} />;
}
