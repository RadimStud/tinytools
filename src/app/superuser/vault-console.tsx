"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowDownToLine, ArrowLeft, File as FileIcon, FolderLock, Search, ShieldCheck, Terminal, Trash2, Upload } from "lucide-react";
import { MAX_VAULT_FILE_SIZE, type PublicVaultFile } from "@/modules/superuser/domain/vault";

function sizeLabel(size: number) {
  return size >= 1048576 ? `${(size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.ceil(size / 1024))} KB`;
}
async function api(url: string, method = "GET", body?: unknown) {
  const response = await fetch(url, { method, cache: "no-store", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Request failed.");
  return result;
}
function putFile(url: string, file: File, progress: (value: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.timeout = 15 * 60 * 1000;
    xhr.upload.onprogress = event => { if (event.lengthComputable) progress(Math.round(event.loaded / event.total * 100)); };
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status}).`));
    xhr.onerror = () => reject(new Error("Upload connection failed. Check your connection and R2 CORS settings."));
    xhr.ontimeout = () => reject(new Error("Upload timed out. Try again."));
    xhr.send(file);
  });
}

export function VaultConsole({ initialFiles }: { initialFiles: PublicVaultFile[] }) {
  const [files, setFiles] = useState(initialFiles);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Private workspace ready.");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);
  const ready = files.filter(file => file.status === "ready");
  const visible = files.filter(file => file.name.toLowerCase().includes(query.toLowerCase()));

  async function refresh() { setFiles((await api("/api/superuser/files")).files); }

  async function upload(selected: File[]) {
    if (inFlight.current || !selected.length) return;
    inFlight.current = true;
    setBusy(true); setError("");
    try {
      for (const file of selected) {
        if (!file.size || file.size > MAX_VAULT_FILE_SIZE) throw new Error(`${file.name}: choose a non-empty file up to 250 MB.`);
        setProgress(0); setMessage(`Uploading ${file.name}`);
        const prepared = await api("/api/superuser/files", "POST", { name: file.name, size: file.size });
        await putFile(prepared.uploadUrl, file, setProgress);
        await api(`/api/superuser/files/${prepared.id}`, "POST");
        await refresh();
      }
      setMessage(`${selected.length} file${selected.length === 1 ? "" : "s"} added to your vault.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed.");
      setMessage("Upload interrupted. You can finish or remove a pending file below.");
      try { await refresh(); } catch { /* Preserve the actionable upload error. */ }
    } finally { setBusy(false); inFlight.current = false; if (input.current) input.current.value = ""; }
  }

  async function changeFile(file: PublicVaultFile, method: "POST" | "DELETE") {
    if (inFlight.current) return;
    if (method === "DELETE" && !window.confirm(`Delete ${file.name} from your vault?`)) return;
    inFlight.current = true; setBusy(true); setError("");
    try {
      await api(`/api/superuser/files/${file.id}`, method);
      await refresh();
      setMessage(method === "DELETE" ? `${file.name} deleted.` : `${file.name} is ready.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Operation failed."); }
    finally { setBusy(false); inFlight.current = false; }
  }

  return (
    <main className="vault">
      <div className="vault-rain" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <span key={i} style={{ left: `${i * 4.4}%`, animationDelay: `${-(i % 9)}s`, animationDuration: `${14 + i % 7}s` }}>01 ミ ニ キ ッ ト 10 0110 ル 01 101 シ 0</span>)}</div>
      <div className="vault-shell">
        <nav className="vault-nav">
          <Link href="/dashboard" className="vault-brand"><Terminal size={23} /> MiniKit<span>{"// SUPERUSER"}</span></Link>
          <Link href="/dashboard" className="vault-back"><ArrowLeft size={15} /> Dashboard</Link>
        </nav>

        <header className="vault-hero">
          <div>
            <p className="vault-eyebrow"><span /> PRIVATE ACCESS / GRANTED</p>
            <h1>Your files.<br /><em>Your rules.</em></h1>
            <p className="vault-intro">A private corner of MiniKit. Drop your files here.<br />Pick them up wherever you log in.</p>
            <div className="vault-access"><ShieldCheck size={16} /> SUPERUSER <span>•</span> OWNER ONLY</div>
          </div>
          <div className="vault-emblem" aria-hidden="true">
            <div className="vault-emblem-ring" />
            <svg viewBox="0 0 200 220" fill="none"><path d="M100 10C41 10 24 48 29 99c4 49 23 88 71 111 48-23 67-62 71-111 5-51-12-89-71-89Z" fill="#06180f" stroke="currentColor" strokeWidth="2"/><path d="M42 64q25-21 47-1M111 63q22-20 47 1" stroke="currentColor" strokeWidth="7" strokeLinecap="round"/><path d="M44 82q24-13 43 4-25 11-43-4ZM113 86q19-17 43-4-18 15-43 4Z" fill="currentColor"/><path d="m100 77-9 44 9 6 9-6-9-44Z" stroke="currentColor" strokeWidth="2"/><path d="M45 132q28 34 55 13 27 21 55-13-10 40-55 36-45 4-55-36Z" fill="currentColor"/><path d="m100 172-9 16 9 14 9-14-9-16Z" fill="currentColor"/><path d="M56 110q9-7 18 0M126 110q9-7 18 0" stroke="currentColor" strokeWidth="2"/></svg>
            <span>PERSONAL VAULT / 01</span>
          </div>
        </header>

        <section className="vault-stats" aria-label="Vault overview">
          <div><span>FILES STORED</span><strong>{String(ready.length).padStart(2, "0")}</strong></div>
          <div><span>SPACE USED</span><strong>{ready.length ? sizeLabel(ready.reduce((total, file) => total + file.sizeBytes, 0)) : "0 KB"}</strong></div>
          <div><span>VISIBILITY</span><strong className="vault-private"><FolderLock size={19} /> Private</strong></div>
        </section>

        <section className={`vault-drop ${dragging ? "is-dragging" : ""}`} aria-label="Upload files"
          onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={event => { event.preventDefault(); setDragging(false); void upload(Array.from(event.dataTransfer.files)); }}>
          <Upload size={30} strokeWidth={1.3} />
          <h2>{busy ? "Transfer in progress" : "Drop something worth keeping."}</h2>
          <p>Any file type. Up to 250 MB per file. Only you have access.</p>
          <input ref={input} type="file" multiple aria-label="Choose vault files" className="vault-file-input" disabled={busy} onChange={event => void upload(Array.from(event.target.files || []))} />
          <button className="vault-primary" disabled={busy} onClick={() => input.current?.click()}><Upload size={16} /> {busy ? `Uploading ${progress}%` : "Choose files"}</button>
          {busy ? <progress max={100} value={progress} aria-label="Upload progress" /> : null}
        </section>

        <div className="vault-notice" role="status"><Terminal size={14} /><span>{message}</span></div>
        {error ? <p className="vault-error" role="alert">{error}</p> : null}

        <section className="vault-library" aria-label="Your files">
          <div className="vault-library-top"><h2>File directory <span>/{String(files.length).padStart(2, "0")}</span></h2><label className="vault-search"><Search size={16} /><input aria-label="Search files" placeholder="Find a file…" value={query} onChange={event => setQuery(event.target.value)} /></label></div>
          {!visible.length ? <div className="vault-empty"><FolderLock size={32} strokeWidth={1} /><p>{query ? "No files match your search." : "Your vault is waiting."}</p><span>{query ? "Try another filename." : "Upload your first file to make this space yours."}</span></div> : <div className="vault-files">{visible.map(file => <article className="vault-file" key={file.id} aria-label={file.name}>
            <div className="vault-file-icon"><FileIcon size={21} /></div>
            <div className="vault-file-info"><h3>{file.name}</h3><p>{sizeLabel(file.sizeBytes)} <span>·</span> {file.createdAt.slice(0, 10)} <span>·</span> {file.status === "ready" ? "Private" : "Pending upload"}</p></div>
            <div className="vault-file-actions">{file.status === "ready" ? <a href={`/api/superuser/files/${file.id}/download`} aria-label={`Download ${file.name}`}><ArrowDownToLine size={18} /><span>Download</span></a> : <button disabled={busy} onClick={() => void changeFile(file, "POST")}>Finish upload</button>}<button disabled={busy} aria-label={`Delete ${file.name}`} onClick={() => void changeFile(file, "DELETE")}><Trash2 size={17} /></button></div>
          </article>)}</div>}
        </section>
        <footer className="vault-footer"><span>MINIKIT / PRIVATE WORKSPACE</span><span>Stay curious. Keep control.</span></footer>
      </div>
    </main>
  );
}
