export const MAX_CSV_BYTES = 2 * 1024 * 1024;
export const MAX_CSV_CELLS = 100_000;
export type CsvOptions = { delimiter: string; header: boolean; trim: boolean; blankRows: boolean; duplicates: boolean };

/** Strict delimited-text parser: quotes, embedded newlines, CRLF and UTF-8 BOM. */
export function parseCsv(text: string, delimiter: string): string[][] {
  if (![",", ";", "\t"].includes(delimiter)) throw new Error("Choose comma, semicolon or tab.");
  if (new TextEncoder().encode(text).length > MAX_CSV_BYTES) throw new Error("Choose a UTF-8 file up to 2 MiB.");
  if (text.includes("\u0000")) throw new Error("This looks like a binary or UTF-16 file. Export it as UTF-8 CSV first.");
  text = text.replace(/^\uFEFF/, "");
  if (!text) return [];
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false, closed = false, cells = 0;
  function pushCell() {
    if (++cells > MAX_CSV_CELLS) throw new Error("This file has too many cells. Use at most 100,000 cells.");
    row.push(cell); cell = ""; closed = false;
  }
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else { quoted = false; closed = true; }
      } else cell += char;
    } else if (char === delimiter) pushCell();
    else if (char === "\n" || char === "\r") {
      pushCell(); rows.push(row); row = [];
      if (char === "\r" && text[i + 1] === "\n") i++;
    } else if (char === '"' && !cell && !closed) quoted = true;
    else {
      if (closed || char === '"') throw new Error(`Unexpected quote or text after a closing quote near character ${i + 1}.`);
      cell += char;
    }
  }
  if (quoted) throw new Error("A quoted field is not closed. Check the source CSV.");
  if (row.length || cell || closed || !/[\r\n]$/.test(text)) { pushCell(); rows.push(row); }
  return rows;
}

export function serializeCsv(rows: string[][], delimiter: string): string {
  return rows.map(row => row.map(cell => /["\r\n]/.test(cell) || cell.includes(delimiter)
    ? `"${cell.replaceAll('"', '""')}"` : cell).join(delimiter)).join("\r\n");
}

export function cleanCsv(text: string, options: CsvOptions) {
  const input = parseCsv(text, options.delimiter);
  const rows: string[][] = [];
  const seen = new Set<string>();
  let removedBlank = 0, removedDuplicates = 0, changedCells = 0;
  for (const [index, source] of input.entries()) {
    const row = source.map(cell => {
      const value = options.trim ? cell.trim() : cell;
      if (value !== cell) changedCells++;
      return value;
    });
    if (index === 0 && options.header) { rows.push(row); continue; }
    if (options.blankRows && row.every(cell => !cell.trim())) { removedBlank++; continue; }
    const key = JSON.stringify(row);
    if (options.duplicates && seen.has(key)) { removedDuplicates++; continue; }
    seen.add(key); rows.push(row);
  }
  const widths = new Set(rows.map(row => row.length));
  return {
    rows, output: serializeCsv(rows, options.delimiter), inputRows: input.length,
    removedBlank, removedDuplicates, changedCells, unevenRows: widths.size > 1,
    formulaCells: rows.reduce((n, row) => n + row.filter(cell => /^[\s]*[=+@-]/.test(cell)).length, 0),
  };
}
