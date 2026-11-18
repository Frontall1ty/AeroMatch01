"use client";

import { useMemo, useState } from "react";
import { MODE_HEX, MODE_LABEL, type Mode } from "@/lib/constants";
import { recommend, type Priority } from "@/lib/decision";
import { RACE_MAX_KM, RACE_MIN_KM, formatDays, raceLanes } from "@/lib/race";
import { useInView } from "./hooks";
import { VEHICLE_ART } from "./Vehicles";

const PRIORITIES: { key: Priority; label: string }[] = [
  { key: "FASTEST", label: "Fastest" },
  { key: "CHEAPEST", label: "Cheapest" },
  { key: "SAFEST", label: "Safest" },
];

const WIDTH: Record<Mode, string> = { ROAD: "clamp(120px, 25%, 270px)", RAIL: "clamp(170px, 38%, 420px)", SEA: "clamp(140px, 28%, 320px)", AIR: "clamp(130px, 26%, 300px)" };

/** Four vehicles race over a distance. The finish order is the real decision rule with demo figures. */
export function Race() {
  const [km, setKm] = useState(5800);
  const [ocean, setOcean] = useState(false);
  const [priority, setPriority] = useState<Priority>("FASTEST");
  const [run, setRun] = useState(0);
  const [ref, seen] = useInView<HTMLDivElement>(0.3);

  const lanes = useMemo(() => raceLanes(km, ocean), [km, ocean]);
  const open = lanes.filter((l) => l.available);
  /** Finishing order: the shortest time arrives first. */
  const rank = new Map([...open].sort((a, b) => a.days - b.days).map((l, i) => [l.mode, i + 1]));
  const scorable = open.map((l) => ({ id: l.mode, totalPrice: l.price, transitDaysMin: l.days, transitDaysMax: l.days, safetyScore: l.safety }));
  const { recommended } = recommend(scorable, priority);
  const minD = Math.min(...open.map((l) => l.days));
  const maxD = Math.max(...open.map((l) => l.days));
  const seconds = (d: number) => (maxD === minD ? 2.4 : 2.4 + 4.6 * ((d - minD) / (maxD - minD)));

  const best = open.find((l) => l.mode === recommended?.id);
  const cheapest = [...open].sort((a, b) => a.price - b.price)[0];
  const summary = !best
    ? ""
    : best.mode === cheapest.mode
      ? `${MODE_LABEL[best.mode]} is the cheapest way over ${km.toLocaleString("en-US")} km: ${formatDays(best.days)} for $${best.price.toLocaleString("en-US")} per tonne.`
      : `${MODE_LABEL[best.mode]} costs $${(best.price - cheapest.price).toLocaleString("en-US")} more per tonne than ${MODE_LABEL[cheapest.mode].toLowerCase()}, the cheapest, and takes ${formatDays(best.days)} instead of ${formatDays(cheapest.days)}.`;

  return (
    <div ref={ref} className="panel p-4 md:p-6">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4 border-b border-rule pb-5">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="race-km" className="field-label">Distance: <span className="condensed text-xl font-bold">{km.toLocaleString("en-US")} km</span></label>
          <input
            id="race-km" type="range" min={RACE_MIN_KM} max={RACE_MAX_KM} step={100} value={km}
            onChange={(e) => { setKm(Number(e.target.value)); setRun((r) => r + 1); }}
            className="!min-h-0 !border-0 !bg-transparent !p-0 accent-[#111827]"
          />
        </div>
        <button
          type="button" role="switch" aria-checked={ocean}
          onClick={() => { setOcean((v) => !v); setRun((r) => r + 1); }}
          className="flex min-h-[44px] items-center gap-3 text-sm font-semibold"
        >
          <span aria-hidden className={`relative h-6 w-11 rounded-full border border-ink transition-colors ${ocean ? "bg-ink" : "bg-white"}`}>
            <span className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${ocean ? "left-[22px] bg-white" : "left-0.5 bg-ink"}`} />
          </span>
          Crosses an ocean
        </button>
        <div role="group" aria-label="What matters most" className="flex overflow-hidden rounded border border-rule">
          {PRIORITIES.map((p) => (
            <button
              key={p.key} type="button" aria-pressed={priority === p.key}
              onClick={() => setPriority(p.key)}
              className={`min-h-[44px] px-4 text-sm font-semibold ${priority === p.key ? "bg-ink text-white" : "bg-panel hover:bg-paper"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn !min-h-[44px]" onClick={() => setRun((r) => r + 1)}>Race again</button>
      </div>

      <ol className="mt-4 space-y-3">
        {lanes.map((l) => {
          const Art = VEHICLE_ART[l.mode];
          const isBest = recommended?.id === l.mode;
          return (
            <li
              key={l.mode}
              className={`relative grid items-center gap-3 rounded border p-3 md:grid-cols-[88px_minmax(0,1fr)_minmax(0,300px)] ${isBest ? "border-ink bg-white shadow-[0_0_0_2px_#111827]" : "border-rule bg-white"} ${l.available ? "" : "opacity-60"}`}
            >
              {isBest && <span className="absolute -top-2.5 left-3 rounded bg-ink px-2 py-0.5 text-xs font-bold text-white">Best pick</span>}
              <div>
                <p className="text-xl font-bold" style={{ color: l.available ? undefined : "#4B5563" }}>{MODE_LABEL[l.mode]}</p>
                {l.available && (
                  <p className="condensed text-sm font-bold text-muted">
                    <span className="sr-only">Arrives in place </span>#{rank.get(l.mode)}
                    <span className="font-normal"> to arrive</span>
                  </p>
                )}
              </div>
              <div className="race-track relative h-[64px]" aria-hidden>
                {l.available && l.mode === "SEA" ? (
                  <div className="race-water absolute inset-x-0 bottom-1 h-[18px] rounded-sm" />
                ) : (
                  <div className="absolute inset-x-0 bottom-3 border-b-[3px] border-dashed" style={{ borderColor: l.available ? MODE_HEX[l.mode] : "#D3D9E2", opacity: 0.35 }} />
                )}
                <div className="race-finish absolute bottom-1.5 right-0 top-1" />
                {l.available ? (
                  <div
                    key={`${run}-${l.mode}`}
                    className={`race-vehicle absolute bottom-1.5 left-0 ${seen ? "race-go" : ""}`}
                    style={{ width: WIDTH[l.mode], ["--vw" as string]: WIDTH[l.mode], ["--dur" as string]: `${seconds(l.days).toFixed(2)}s` }}
                  >
                    <Art className="block w-full" />
                  </div>
                ) : (
                  <p className="absolute bottom-3 left-0 text-sm font-semibold text-muted">{l.reason}</p>
                )}
              </div>
              <dl className="grid grid-cols-3 gap-2 text-sm">
                <div className="rounded bg-paper p-2"><dt className="text-xs text-muted">Time</dt><dd className="condensed text-lg font-bold">{l.available ? formatDays(l.days) : "—"}</dd></div>
                <div className="rounded bg-paper p-2"><dt className="text-xs text-muted">Cost / t</dt><dd className="condensed text-lg font-bold">{l.available ? `$${l.price.toLocaleString("en-US")}` : "—"}</dd></div>
                <div className="rounded bg-paper p-2">
                  <dt className="text-xs text-muted">Safety</dt>
                  <dd className="text-lg font-bold">
                    {l.available ? (
                      <>
                        <span className="sr-only">{l.safety} of 5</span>
                        <span aria-hidden>{"●".repeat(l.safety)}<span className="text-[#C3CAD6]">{"●".repeat(5 - l.safety)}</span></span>
                      </>
                    ) : "—"}
                  </dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ol>

      <p className="mt-4 text-sm" aria-live="polite">
        {summary}
      </p>
      <p className="mt-2 text-xs text-muted">Demo data: invented figures per tonne of cargo, including handling time at both ends. Safety is a demo estimate. They are not quotes.</p>
    </div>
  );
}
