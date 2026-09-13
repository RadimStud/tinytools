import Link from "next/link";
export const metadata = { title: "ORION — coming soon" };
export default function OrionPage() {
  return <main className="min-h-screen bg-neutral-950 px-6 py-16 text-neutral-100"><div className="mx-auto max-w-xl">
    <h1 className="text-4xl font-semibold">ORION is coming soon</h1><p className="mt-6 text-neutral-300">The private assistant is not connected to public accounts. Multi-user isolation and the shared staging integration must pass before launch.</p>
    <Link className="mt-8 inline-block underline" href="/apps">Back to My apps</Link>
  </div></main>;
}
