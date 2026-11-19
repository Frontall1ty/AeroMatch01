import Link from "next/link";
import type { ReactNode } from "react";

/** Presentational pieces of the admin console. All of them are for the dark surface. */

export function PageHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-5">
      <h1 className="h-wide text-[26px] md:text-[32px]">{title}</h1>
      {children && <div className="mt-2 max-w-[70ch] text-console-muted">{children}</div>}
    </div>
  );
}

export function Tile({ label, value, sub, href, alert = false }: { label: string; value: ReactNode; sub?: ReactNode; href?: string; alert?: boolean }) {
  const body = (
    <div className={`panel-dark ticks h-full p-4 ${href ? "transition-colors hover:border-ion-bright" : ""}`}>
      <p className="text-sm text-console-muted">{label}</p>
      <p className={`condensed mt-1 text-[44px] font-bold leading-none ${alert ? "text-[#FCD34D]" : ""}`}>{value}</p>
      {sub && <p className="mt-2 text-sm text-console-muted">{sub}</p>}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

export function Card({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="panel-dark p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Horizontal bars with the number at the end. */
export function BarList({ rows, empty = "Nothing yet." }: { rows: { label: string; value: number; color: string }[]; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.every((r) => r.value === 0)) return <p className="text-sm text-console-muted">{empty}</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[96px_minmax(0,1fr)_44px] items-center gap-3 text-sm">
          <span className="truncate">{r.label}</span>
          <span className="h-2.5 rounded-sm bg-console" aria-hidden>
            <span className="block h-full rounded-sm" style={{ width: `${(r.value / max) * 100}%`, background: r.color }} />
          </span>
          <span className="condensed text-right text-lg font-bold">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}

/** One bar per day. Reads as text for screen readers. */
export function DayBars({ buckets, color = "#FF5B1F", label }: { buckets: { day: string; count: number }[]; color?: string; label: string }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const total = buckets.reduce((a, b) => a + b.count, 0);
  const w = 14 * 22;
  return (
    <div>
      <svg viewBox={`0 0 ${w} 84`} className="w-full" role="img" aria-label={`${label}: ${total} in the last ${buckets.length} days`}>
        <line x1="0" y1="72.5" x2={w} y2="72.5" stroke="#2C2C30" />
        {buckets.map((b, i) => {
          const h = (b.count / max) * 64;
          return (
            <g key={b.day}>
              <rect x={i * 22 + 4} y={72 - h} width="14" height={Math.max(h, b.count ? 2 : 0)} rx="2" fill={color}>
                <title>{`${b.day}: ${b.count}`}</title>
              </rect>
              {b.count > 0 && <text x={i * 22 + 11} y={72 - h - 4} textAnchor="middle" fontSize="9" fill="#F4F4F2">{b.count}</text>}
            </g>
          );
        })}
        <text x="4" y="83" fontSize="8" fill="#A1A1A8">{buckets[0]?.day.slice(5)}</text>
        <text x={w - 4} y="83" fontSize="8" textAnchor="end" fill="#A1A1A8">{buckets.at(-1)?.day.slice(5)}</text>
      </svg>
    </div>
  );
}

const PILL = {
  good: "border-[#4ADE80] text-[#86EFAC]",
  warn: "border-[#FCD34D] text-[#FCD34D]",
  bad: "border-[#FCA5A5] text-[#FCA5A5]",
  info: "border-ion-bright text-ion-bright",
  quiet: "border-console-rule text-console-muted",
} as const;

export function Pill({ tone = "quiet", children }: { tone?: keyof typeof PILL; children: ReactNode }) {
  return <span className={`inline-block whitespace-nowrap rounded border px-2 py-0.5 text-xs font-semibold ${PILL[tone]}`}>{children}</span>;
}

/** Links that narrow a list. The current one is marked. */
export function FilterChips({
  basePath, param, options, current, keep = {},
}: {
  basePath: string;
  param: string;
  options: { value: string; label: string; count?: number }[];
  current: string;
  /** Other query values to carry along, such as the search text. */
  keep?: Record<string, string>;
}) {
  const href = (value: string) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(keep)) if (v) q.set(k, v);
    if (value !== options[0].value) q.set(param, value);
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  return (
    <nav aria-label="Filter" className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Link
          key={o.value}
          href={href(o.value)}
          aria-current={current === o.value ? "true" : undefined}
          className={`inline-flex min-h-[40px] items-center gap-2 rounded border px-3 text-sm font-semibold ${current === o.value ? "border-ion-bright bg-ion-bright text-console" : "border-console-rule hover:border-ion-bright"}`}
        >
          {o.label}
          {o.count !== undefined && <span className={`condensed text-base ${current === o.value ? "" : "text-console-muted"}`}>{o.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function SearchForm({ action, q, placeholder, keep = {} }: { action: string; q: string; placeholder: string; keep?: Record<string, string> }) {
  return (
    <form action={action} method="get" role="search" className="flex gap-2">
      {Object.entries(keep).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <label htmlFor="admin-q" className="sr-only">Search</label>
      <input id="admin-q" name="q" defaultValue={q} placeholder={placeholder} maxLength={80} className="!w-64 !border-console-rule !bg-console !text-console-text placeholder:!text-console-muted" />
      <button className="btn-ghost">Search</button>
    </form>
  );
}

export const TH = "p-3 font-semibold";
export const TD = "p-3 align-top";

export function DataTable({ children, minWidth = 860 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="panel-dark relative overflow-x-auto">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export const THEAD = "border-b border-console-rule text-xs text-console-muted";
export const TROW = "border-b border-console-rule/60 last:border-0";

export function Empty({ children }: { children: ReactNode }) {
  return <p className="panel-dark p-6 text-console-muted">{children}</p>;
}
