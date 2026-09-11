"use client";

import { useState } from "react";
import { cleanCsv, MAX_CSV_BYTES, type CsvOptions } from "@/modules/workbench/csv";

const sample = 'name,email,team\n Alice ,alice@example.com, QA \nBob,bob@example.com,Dev\n Alice ,alice@example.com, QA \n,,\n';
const control = "rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm disabled:opacity-50";

export function CsvCleaner() {
  const [source, setSource] = useState("");
  const [filename, setFilename] = useState("data.csv");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [options, setOptions] = useState<CsvOptions>({ delimiter: ",", header: true, trim: true, blankRows: true, duplicates: true });
  const [result, setResult] = useState<ReturnType<typeof cleanCsv> | null>(null);
  function edit(value: string) { setSource(value); setResult(null); setError(""); }
  function option<K extends keyof CsvOptions>(key: K, value: CsvOptions[K]) { setOptions({ ...options, [key]: value }); setResult(null); setError(""); }
  async function read(file?: File) {
    if (!file) return;
    setLoading(true); setResult(null); setError(""); setSource("");
    try {
      if (file.size > MAX_CSV_BYTES) throw new Error("Choose a UTF-8 file up to 2 MiB.");
      const text = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
      setSource(text); setFilename(file.name);
    } catch (reason) { setError(reason instanceof TypeError ? "Cannot read this encoding. Export the file as UTF-8 CSV first." : reason instanceof Error ? reason.message : "Could not read the file."); }
    finally { setLoading(false); }
  }
  function run() {
    try { setResult(cleanCsv(source, options)); setError(""); }
    catch (reason) { setResult(null); setError(reason instanceof Error ? reason.message : "Could not clean this CSV."); }
  }
  function download() {
    if (!result) return;
    const url = URL.createObjectURL(new Blob(["\uFEFF", result.output], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url;
    a.download = `${filename.replace(/\.[^.]+$/, "") || "data"}-cleaned.csv`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="space-y-6">
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 sm:p-7" aria-label="CSV input">
      <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-xl font-semibold">01 / Start with your data</h2><button className={control} disabled={loading} onClick={() => { edit(sample); setFilename("sample.csv"); }}>Try sample</button></div>
      <label className="mt-5 block text-sm text-neutral-300">Choose CSV or TSV<input className="mt-2 block w-full max-w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-800 file:px-4 file:py-3 file:text-neutral-100" type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" disabled={loading} onChange={event => { void read(event.target.files?.[0]); event.target.value = ""; }} /></label>
      <label className="mt-5 block text-sm text-neutral-300">Or paste CSV<textarea disabled={loading} spellCheck={false} value={source} onChange={event => edit(event.target.value)} className="mt-2 block min-h-48 w-full rounded-xl border border-neutral-700 bg-neutral-950 p-4 font-mono text-sm text-neutral-100" placeholder="name,email,team" /></label>
      <p className="mt-2 text-xs text-neutral-500">Only local processing. File contents are not sent to MiniKit or saved between visits.</p>
    </section>
    <section className="rounded-2xl border border-neutral-800 p-5 sm:p-7" aria-label="Cleaning options">
      <h2 className="text-xl font-semibold">02 / Choose what changes</h2>
      <fieldset disabled={loading} className="mt-5 flex flex-wrap items-center gap-5"><legend className="sr-only">CSV settings</legend>
        <label className="text-sm">Separator <select className={`${control} ml-2`} value={options.delimiter} onChange={event => option("delimiter", event.target.value)}><option value=",">Comma</option><option value=";">Semicolon</option><option value={"\t"}>Tab</option></select></label>
        {([["header", "First row is a header"], ["trim", "Trim cell spaces"], ["blankRows", "Remove blank rows"], ["duplicates", "Remove duplicate rows"]] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={options[key]} onChange={event => option(key, event.target.checked)} className="accent-emerald-300" />{label}</label>)}
      </fieldset>
      <p className="mt-4 text-xs text-neutral-400">Duplicate matching compares all cells after trimming, if enabled. The header is kept separately.</p>
      <div className="mt-6 flex flex-wrap gap-3"><button disabled={loading || !source} onClick={run} className="rounded-lg bg-emerald-300 px-6 py-3 text-sm font-semibold text-neutral-950 disabled:opacity-40">{loading ? "Reading file…" : "Clean CSV"}</button><button disabled={loading} className={control} onClick={() => { edit(""); setFilename("data.csv"); }}>Clear data</button></div>
    </section>
    {error && <p role="alert" className="rounded-lg border border-red-900 bg-red-950/30 p-4 text-red-200">{error}</p>}
    {result && <section className="rounded-2xl border border-emerald-900 bg-emerald-950/10 p-5 sm:p-7" aria-label="Cleaned result">
      <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-xl font-semibold">03 / Check your result</h2><button className="rounded-lg bg-emerald-300 px-5 py-3 text-sm font-semibold text-neutral-950 disabled:opacity-40" disabled={!result.rows.length} onClick={download}>Download cleaned CSV</button></div>
      <p role="status" className="mt-4 text-sm text-emerald-200">{result.inputRows} input rows → {result.rows.length} output rows. Removed {result.removedDuplicates} duplicate rows and {result.removedBlank} blank rows. Trimmed {result.changedCells} cells.</p>
      {result.unevenRows && <p className="mt-4 text-sm text-amber-200">Rows have different column counts. Check your separator and source file. All remaining cells were preserved.</p>}
      {result.formulaCells > 0 && <p className="mt-4 text-sm text-amber-200">{result.formulaCells} cells start with a character that a spreadsheet may treat as a formula. Values are unchanged; import untrusted data as text.</p>}
      <p className="mt-5 text-xs text-neutral-400">Preview: first 10 rows and 8 columns; long cells are shortened here only. The download contains all remaining data.</p>
      <div className="mt-3 max-w-full overflow-x-auto rounded-lg border border-neutral-800"><table className="w-full text-left text-sm"><caption className="sr-only">Cleaned CSV preview</caption><tbody>{result.rows.slice(0, 10).map((row, i) => <tr key={i} className="border-b border-neutral-800">{row.slice(0, 8).map((cell, j) => i === 0 && options.header ? <th scope="col" key={j} className="min-w-28 max-w-64 break-words bg-neutral-900 p-3">{cell.slice(0, 150)}</th> : <td key={j} className="min-w-28 max-w-64 break-words p-3">{cell.slice(0, 150)}</td>)}</tr>)}</tbody></table></div>
    </section>}
  </div>;
}
