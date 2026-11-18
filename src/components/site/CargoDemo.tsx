"use client";

import { useState } from "react";
import { MODE_LABEL, VOLUMETRIC_FACTOR } from "@/lib/constants";
import { totalsFromPieces } from "@/lib/fit";
import { int } from "@/lib/format";
import { chargeableWeight } from "@/lib/rules";
import { ModeTag } from "@/components/ui";
import { CountUp } from "./CountUp";
import { CRATES, SITE_MODES } from "./siteData";

const FILL = { AIR: "bg-air", SEA: "bg-sea", RAIL: "bg-rail", ROAD: "bg-road" } as const;

type Fields = { n: string; kg: string; l: string; w: string; h: string };

/** One cargo entry. The totals and the charged weight of every mode follow while you type. */
export function CargoDemo() {
  const [f, setF] = useState<Fields>({ n: String(CRATES.count), kg: String(CRATES.weightKg), l: String(CRATES.lengthCm), w: String(CRATES.widthCm), h: String(CRATES.heightCm) });
  const [stack, setStack] = useState(true);

  const num = (s: string) => Number(s.replace(",", "."));
  const v = { n: num(f.n), kg: num(f.kg), l: num(f.l), w: num(f.w), h: num(f.h) };
  const ok = Object.values(v).every((x) => Number.isFinite(x) && x > 0);
  const totals = ok ? totalsFromPieces(v.n, { lengthCm: v.l, widthCm: v.w, heightCm: v.h, weightKg: v.kg, stackable: stack }) : null;

  const rows = totals
    ? SITE_MODES.map((m) => ({ m, ...chargeableWeight({ mode: m, weightKg: totals.weightKg, volumeM3: totals.volumeM3 }) }))
    : [];
  const scale = Math.max(1, ...rows.flatMap((r) => [r.actualKg, r.volumetricKg]));

  const field = (key: keyof Fields, label: string, unit: string) => (
    <div>
      <label htmlFor={`cd-${key}`} className="field-label">{label}</label>
      <div className="relative">
        <input id={`cd-${key}`} inputMode="decimal" value={f[key]} onChange={(e) => setF((p) => ({ ...p, [key]: e.target.value }))} className="pr-10" />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="panel p-4 md:p-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {field("n", "Pieces", "")}
        {field("kg", "One piece", "kg")}
        <div className="col-span-2 sm:col-span-1" />
        {field("l", "Length", "cm")}
        {field("w", "Width", "cm")}
        {field("h", "Height", "cm")}
      </div>
      <label className="mt-2 flex min-h-[44px] cursor-pointer items-center gap-3">
        <input type="checkbox" checked={stack} onChange={(e) => setStack(e.target.checked)} />
        <span className="text-sm font-semibold">Pieces can be stacked 2 high</span>
      </label>

      <div className="mt-3 border-t border-rule pt-4" aria-live="polite">
        {totals ? (
          <>
            <dl className="grid grid-cols-3 gap-3">
              <div>
                <dt className="text-xs text-muted">Weight</dt>
                <dd className="condensed text-[32px] font-bold leading-none"><CountUp value={totals.weightKg} /> <span className="text-base">kg</span></dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Volume</dt>
                <dd className="condensed text-[32px] font-bold leading-none"><CountUp value={totals.volumeM3} decimals={1} /> <span className="text-base">m³</span></dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Floor space</dt>
                <dd className="condensed text-[32px] font-bold leading-none"><CountUp value={totals.floorAreaM2} decimals={1} /> <span className="text-base">m²</span></dd>
              </div>
            </dl>

            <p className="mt-5 text-sm font-semibold">Charged weight by mode</p>
            <ul className="mt-2 space-y-3">
              {rows.map((r) => (
                <li key={r.m}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <ModeTag mode={r.m} />
                    <p className="text-sm">
                      Actual {int(r.actualKg)} kg, volumetric {int(r.volumetricKg)} kg (×{VOLUMETRIC_FACTOR[r.m]}),{" "}
                      <span className="font-bold">charged {int(r.chargedKg)} kg</span>
                    </p>
                  </div>
                  <div className="mt-1 space-y-1" aria-hidden>
                    <div className="h-1.5 rounded bg-ink/70 transition-[width] duration-500" style={{ width: `${(r.actualKg / scale) * 100}%` }} />
                    <div className={`h-1.5 rounded transition-[width] duration-500 ${FILL[r.m]}`} style={{ width: `${(r.volumetricKg / scale) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">Dark bar: actual weight. Colored bar: volumetric weight. A carrier charges the larger one. {MODE_LABEL.AIR} uses 167 kg per m³.</p>
          </>
        ) : (
          <p className="text-sm text-muted">Enter all five numbers to see the totals.</p>
        )}
      </div>
    </div>
  );
}
