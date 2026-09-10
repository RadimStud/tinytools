import Link from "next/link";
import { CsvCleaner } from "./csv-cleaner";

export const metadata = {
  title: "Free CSV Cleaner — trim, deduplicate and preview",
  description: "Clean CSV files locally in your browser. Remove duplicate and blank rows, trim spaces and preview the result. Free, no signup, no file upload.",
};

export default function CsvCleanerPage() {
  return <main className="min-h-screen bg-neutral-950 px-5 py-10 text-neutral-100">
    <div className="mx-auto max-w-6xl">
      <nav className="flex flex-wrap justify-between gap-4 text-sm"><Link href="/" className="font-semibold">← MiniKit</Link><Link href="/community" className="text-emerald-300">Help shape the next tool →</Link></nav>
      <header className="my-12 max-w-3xl"><p className="text-xs uppercase tracking-widest text-emerald-300">MiniKit Workbench / 001</p><h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">Less mess.<br /><span className="text-emerald-300">Cleaner CSV.</span></h1><p className="mt-5 text-neutral-400">Trim spaces, remove duplicate rows and clear blank rows. Preview the changes before downloading a new file.</p><p className="mt-4 text-sm text-emerald-200">Free · No account · File contents stay in this browser</p></header>
      <CsvCleaner />
      <section className="mt-14 grid gap-6 border-t border-neutral-800 pt-8 sm:grid-cols-3">
        <div><h2 className="font-semibold">What stays unchanged?</h2><p className="mt-2 text-sm text-neutral-400">Values remain text: leading zeros and dates are not converted. Your original file is never overwritten. Export uses CRLF line endings.</p></div>
        <div><h2 className="font-semibold">Which files work?</h2><p className="mt-2 text-sm text-neutral-400">UTF-8 CSV and TSV, up to 2 MiB and 100,000 cells. Choose the separator explicitly. Quoted fields and embedded line breaks are supported.</p></div>
        <div><h2 className="font-semibold">Something missing?</h2><p className="mt-2 text-sm text-neutral-400">Tell us about a real task and the output you need. Use a made-up sample rather than personal or work data.</p><Link href="/community" className="mt-3 inline-block text-sm text-emerald-300">Share your use case →</Link></div>
      </section>
    </div>
  </main>;
}
