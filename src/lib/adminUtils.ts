/** Small pure helpers for the admin console. */

export type CsvValue = string | number | boolean | Date | null | undefined;

/** One CSV cell. Text that a spreadsheet could read as a formula gets a leading apostrophe. */
export function csvCell(v: CsvValue): string {
  if (v === null || v === undefined) return "";
  let s = v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s) && typeof v === "string") s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: CsvValue[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/** How many dates fall on each of the last `days` days (UTC), oldest first. */
export function dayBuckets(dates: Date[], days: number, now: Date = new Date()): { day: string; count: number }[] {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const out = Array.from({ length: days }, (_, i) => ({ day: new Date(end - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10), count: 0 }));
  const index = new Map(out.map((b, i) => [b.day, i]));
  for (const d of dates) {
    const i = index.get(d.toISOString().slice(0, 10));
    if (i !== undefined) out[i].count += 1;
  }
  return out;
}

/** A search box value made safe for a query: trimmed, short, no control characters. */
export function cleanQuery(q: string | string[] | undefined): string {
  const s = Array.isArray(q) ? q[0] : q;
  // eslint-disable-next-line no-control-regex
  return (s ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 80);
}

/** Picks the filter value from the address when it is one of the allowed ones, else the first. */
export function pickFilter<T extends string>(value: string | string[] | undefined, allowed: readonly T[]): T {
  const v = Array.isArray(value) ? value[0] : value;
  return (allowed as readonly string[]).includes(v ?? "") ? (v as T) : allowed[0];
}
