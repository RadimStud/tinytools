import { AppsView } from "@/modules/platform/components/apps-view";
import { PlatformShell, PlatformUnavailable } from "@/modules/platform/components/platform-shell";
import { platformPageData } from "@/modules/platform/page-data";
export const dynamic = "force-dynamic";
export const metadata = { title: "My apps | MiniKit", robots: { index: false, follow: false } };
export default async function AppsPage() {
  const data = await platformPageData("/apps", async service => ({ me: await service.me(), apps: await service.apps() }));
  if (!data) return <PlatformUnavailable />;
  return <PlatformShell title="My apps" platformAdmin={data.me.platform_permissions.includes("platform.admin")}>
    <p className="mb-8 text-neutral-300">Signed in as {data.me.display_name}. One account, separate access for each application.</p><AppsView apps={data.apps} />
    <p className="mt-8 text-sm text-neutral-400">AI billing is not enabled. Your private Superuser vault remains separate from this catalog.</p>
  </PlatformShell>;
}
