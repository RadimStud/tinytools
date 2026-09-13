import Link from "next/link";
import type { AppView } from "../domain/platform";
const labels = { available: "Available", no_access: "No access", coming_soon: "Coming soon", unavailable: "Temporarily unavailable" };

export function AppsView({ apps }: { apps: AppView[] }) {
  return <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{apps.map(app => <article aria-label={app.name} key={app.app_id} className="flex min-w-0 flex-col rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
    <p className="text-xs uppercase tracking-widest text-neutral-400">{labels[app.display_state]}</p><h2 className="mt-4 text-xl font-semibold">{app.name}</h2>
    <p className="mt-3 flex-1 text-sm leading-6 text-neutral-300">{app.description}</p>
    {app.app_id === "orion" && <p className="mt-4 text-sm text-amber-200">An access grant does not activate ORION. Multi-user isolation and the integration gateway must pass separate tests first.</p>}
    <div className="mt-6">{app.launch_path ? <Link className="inline-block rounded-lg bg-neutral-100 px-5 py-3 text-sm font-medium text-neutral-950" href={app.launch_path}>Open {app.name}</Link> : <button type="button" disabled className="rounded-lg border border-neutral-700 px-5 py-3 text-sm text-neutral-500">{labels[app.display_state]}</button>}</div>
  </article>)}</div>;
}
