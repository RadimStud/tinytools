import { PlatformShell, PlatformUnavailable } from "@/modules/platform/components/platform-shell";
import { AccessEditor } from "@/modules/platform/components/access-editor";
import { platformPageData } from "@/modules/platform/page-data";
export const dynamic = "force-dynamic";
export const metadata = { title: "Platform administration | MiniKit", robots: { index: false, follow: false } };
export default async function PlatformAdminPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const { subject } = await searchParams;
  const data = await platformPageData("/platform/admin", service => service.adminOverview(subject));
  if (!data) return <PlatformUnavailable />;
  return <PlatformShell title="Platform administration" platformAdmin>
    <p className="max-w-3xl text-neutral-300">Manage explicit application access. This page does not grant platform administrators, change Market roles, open private chats or enable AI spending.</p>
    <form method="get" className="mt-8 flex flex-wrap items-end gap-4"><label className="min-w-0 flex-1 text-sm">Account (Auth UUID)<input name="subject" defaultValue={subject} list="platform-users" required className="mt-2 block w-full rounded-lg border border-neutral-700 bg-neutral-900 p-3 font-mono" /></label><datalist id="platform-users">{data.users.map(user => <option key={user.auth_user_id} value={user.auth_user_id}>{user.display_name}</option>)}</datalist><button className="rounded-lg border border-neutral-700 px-5 py-3">Load access</button></form>
    <p className="mt-2 text-xs text-neutral-400">Suggestions include the latest 100 mapped accounts. A known Auth UUID can also be entered directly.</p>
    {subject && <section className="mt-8 space-y-4" aria-label="Application access">{data.apps.filter(app => app.access_mode === "explicit").map(app => {
      const grant = data.grants.find(row => row.app_id === app.app_id);
      return <AccessEditor key={`${subject}:${app.app_id}:${grant?.policy_version ?? 0}`} subject={subject} app={app} grant={grant} />;
    })}</section>}
    <h2 className="mt-12 text-2xl font-semibold">Recent administrative changes</h2><p className="mt-2 text-sm text-neutral-400">Last 50 events. No conversation contents or tokens are recorded.</p>
    <div className="mt-5 max-w-full overflow-x-auto rounded-xl border border-neutral-800"><table className="w-full text-left text-sm"><caption className="sr-only">Platform audit events</caption><thead className="bg-neutral-900"><tr>{["UTC time", "Action", "Application", "Outcome", "Request ID"].map(label => <th className="p-4" key={label}>{label}</th>)}</tr></thead><tbody>{data.audit.map(event => <tr key={event.request_id} className="border-t border-neutral-800"><td className="whitespace-nowrap p-4">{event.created_at}</td><td className="p-4">{event.action}</td><td className="p-4">{event.app_id ?? "Platform"}</td><td className="p-4">{event.outcome}</td><td className="p-4 font-mono text-xs">{event.request_id}</td></tr>)}</tbody></table></div>
  </PlatformShell>;
}
