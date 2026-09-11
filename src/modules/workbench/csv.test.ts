import { describe, expect, it } from "vitest";
import { cleanCsv, MAX_CSV_BYTES, parseCsv, serializeCsv } from "./csv";
const options = { delimiter: ",", header: true, trim: true, blankRows: true, duplicates: true };
describe("CSV workbench", () => {
  it("preserves quoted delimiters, escaped quotes and embedded newlines", () => {
    const rows = [['a,b', 'say "hi"', 'two\nlines'], ['001', 'Žluťoučký', '']];
    expect(parseCsv(serializeCsv(rows, ","), ",")).toEqual(rows);
  });
  it("handles BOM, CRLF, a trailing empty field and a final newline", () => {
    expect(parseCsv("\uFEFFa;b\r\n001;\r\n", ";")).toEqual([["a", "b"], ["001", ""]]);
  });
  it("removes duplicates after trimming while protecting the first row", () => {
    const result = cleanCsv("x,y\nx,y\n a ,b\na,b\n,\n", options);
    expect(result.rows).toEqual([["x", "y"], ["x", "y"], ["a", "b"]]);
    expect(result.removedBlank).toBe(1); expect(result.removedDuplicates).toBe(1);
    expect(result.changedCells).toBe(1);
  });
  it("preserves all data when transformations are disabled", () => {
    expect(cleanCsv("001, 2 \n001, 2 \n,", { ...options, header: false, trim: false, blankRows: false, duplicates: false }).rows)
      .toEqual([["001", " 2 "], ["001", " 2 "], ["", ""]]);
  });
  it("reports uneven rows without padding or truncating", () => {
    const result = cleanCsv("a,b\n1\n2,3,4", options);
    expect(result.unevenRows).toBe(true); expect(result.rows[2]).toEqual(["2", "3", "4"]);
  });
  it("reports potential formulas without rewriting values", () => {
    const result = cleanCsv('value\n=1+1\n-2\n@cmd', options);
    expect(result.formulaCells).toBe(3); expect(result.rows[1][0]).toBe("=1+1");
  });
  it.each(['"unclosed', 'a"b,c', '"a"x,b'])("rejects malformed quoting: %s", input => {
    expect(() => parseCsv(input, ",")).toThrow();
  });
  it("supports tab-separated input and empty files", () => {
    expect(parseCsv("a\tb\n1\t2", "\t")).toEqual([["a", "b"], ["1", "2"]]);
    expect(parseCsv("", ",")).toEqual([]);
  });
  it("preserves an intentionally retained single empty cell on export", () => {
    const result = cleanCsv('""', { ...options, header: false, blankRows: false });
    expect(parseCsv(result.output, ",")).toEqual([[""]]);
  });
  it("rejects oversized and binary input", () => {
    expect(() => parseCsv("a".repeat(MAX_CSV_BYTES + 1), ",")).toThrow(/2 MiB/);
    expect(() => parseCsv("a\u0000", ",")).toThrow(/UTF-16/);
    expect(() => parseCsv(",".repeat(100_001), ",")).toThrow(/cells/);
  });
});
