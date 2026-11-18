"use client";

import { useEffect, useMemo, useState } from "react";
import { MODE_LABEL, type Mode } from "@/lib/constants";
import { COUNTRIES, CITIES } from "@/lib/places";
import { ModeTag } from "@/components/ui";
import { BOARD_ROWS } from "./boardData";
import { prefersReducedMotion, useInView } from "./hooks";

const NAMES: Record<string, string> = Object.fromEntries(CITIES.map((c) => [c.code, c.name.toUpperCase()]));
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const TONE = { warn: "text-[#92400E] bg-[#FEF3C7]", done: "text-[#1E40AF] bg-[#DBEAFE]", go: "text-[#14532D] bg-[#DCFCE7]", none: "text-ink bg-[#EEF2F7]" } as const;

/** Split-flap text: each tile flips through letters, then settles. Plain text for screen readers and reduced motion. */
function Flap({ text, len, tone = "none", go }: { text: string; len: number; tone?: keyof typeof TONE; go: boolean }) {
  const target = text.padEnd(len, " ").slice(0, len);
  const [shown, setShown] = useState(target);
  useEffect(() => {
    if (!go || prefersReducedMotion()) { setShown(target); return; }
    const start = Date.now();
    setShown(Array.from(target, (ch) => (ch === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join(""));
    const t = setInterval(() => {
      const el = Date.now() - start;
      setShown(Array.from(target, (ch, i) => (ch === " " || el > 350 + i * 55 ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join(""));
      if (el > 350 + len * 55) clearInterval(t);
    }, 55);
    return () => clearInterval(t);
  }, [target, go, len]);
  return (
    <span className="flex gap-[3px]">
      <span className="sr-only">{text}</span>
      {Array.from(shown, (ch, i) => (
        <span key={i} aria-hidden className={`flap flex h-8 w-[18px] items-center justify-center rounded-[3px] font-mono text-[15px] font-bold ${TONE[tone]}`}>
          {ch === " " ? "" : ch}
        </span>
      ))}
    </span>
  );
}

const FILTERS: ("ALL" | Mode)[] = ["ALL", "ROAD", "SEA", "AIR", "RAIL"];

/** A departures board with invented shipments. The filter chips narrow it by mode. */
export function Board() {
  const [filter, setFilter] = useState<"ALL" | Mode>("ALL");
  const [ref, seen] = useInView<HTMLDivElement>(0.2);
  const rows = useMemo(() => BOARD_ROWS.filter((r) => filter === "ALL" || r.mode === filter).slice(0, 6), [filter]);

  return (
    <div ref={ref}>
      <div className="panel p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-4">
          <p className="text-sm font-bold tracking-widest text-muted"><span aria-hidden className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-good" />SAMPLE SHIPMENTS · INVENTED DATA</p>
          <div role="group" aria-label="Filter by mode" className="flex flex-wrap overflow-hidden rounded border border-rule">
            {FILTERS.map((f) => (
              <button
                key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}
                className={`min-h-[44px] px-3 text-sm font-bold ${filter === f ? "bg-ink text-white" : "bg-panel hover:bg-paper"}`}
              >
                {f === "ALL" ? "All" : MODE_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 hidden grid-cols-[170px_minmax(0,1fr)_minmax(0,1fr)_92px_110px_minmax(0,230px)] gap-3 px-3 text-xs font-bold tracking-widest text-muted md:grid" aria-hidden>
          <span>SHIPMENT</span><span>FROM</span><span>TO</span><span>MODE</span><span>ETA</span><span>STATUS</span>
        </div>

        <ul className="mt-2 space-y-2" aria-live="polite">
          {rows.map((r) => (
            <li key={r.id} className="rounded border border-rule bg-white px-3 py-2.5">
              {/* phones: plain text */}
              <div className="md:hidden">
                <p className="flex items-center justify-between font-mono text-sm font-bold"><span>{r.id}</span><ModeTag mode={r.mode} /></p>
                <p className="mt-1 text-base font-semibold">{NAMES[r.from]} → {NAMES[r.to]}</p>
                <p className="text-sm text-muted">ETA {r.eta} · {r.status}</p>
              </div>
              {/* larger screens: flip tiles */}
              <div className="hidden grid-cols-[170px_minmax(0,1fr)_minmax(0,1fr)_92px_110px_minmax(0,230px)] items-center gap-3 md:grid">
                <Flap text={r.id} len={7} go={seen} />
                <Flap text={NAMES[r.from]} len={Math.min(11, NAMES[r.from].length)} go={seen} />
                <Flap text={NAMES[r.to]} len={Math.min(11, NAMES[r.to].length)} go={seen} />
                <span><ModeTag mode={r.mode} /></span>
                <Flap text={r.eta} len={6} go={seen} />
                <Flap text={r.status} len={Math.min(12, r.status.length)} tone={r.tone ?? "none"} go={seen} />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">Demo data. Nothing here is a real shipment, carrier or schedule.</p>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          [String(CITIES.length), "cities to ship from and to"],
          [String(COUNTRIES.length), "countries"],
          ["4", "ways to ship: air, sea, rail, road"],
        ].map(([n, label]) => (
          <div key={label} className="panel p-4">
            <dd className="condensed text-[44px] font-bold leading-none">{n}</dd>
            <dt className="mt-1 text-sm text-muted">{label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
