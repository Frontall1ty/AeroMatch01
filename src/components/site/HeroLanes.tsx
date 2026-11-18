"use client";

import { useMemo, useState } from "react";
import { MODE_LABEL, type Mode } from "@/lib/constants";
import { money } from "@/lib/format";
import { recommend, recommendationReason, type Priority } from "@/lib/rules";
import { DemoBadge, ModeTag } from "@/components/ui";
import { HERO_AXIS_DAYS, HERO_DEADLINE_DAY, HERO_OFFERS, SITE_MODES } from "./siteData";

const FILL: Record<Mode, string> = { AIR: "bg-air", SEA: "bg-sea", RAIL: "bg-rail", ROAD: "bg-road" };
const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "CHEAPEST", label: "Cheapest" },
  { value: "FASTEST", label: "Fastest" },
  { value: "BALANCED", label: "Balanced" },
];
const ROW = 38;
const pct = (day: number) => `${(day / HERO_AXIS_DAYS) * 100}%`;

/** The one memorable element: the real decision rules running on demo offers. */
export function HeroLanes() {
  const [priority, setPriority] = useState<Priority>("BALANCED");
  const { recommended } = useMemo(() => recommend(HERO_OFFERS, priority), [priority]);
  const reason = recommended ? recommendationReason(recommended, HERO_OFFERS) : "";
  const ticks = Array.from({ length: HERO_AXIS_DAYS / 2 + 1 }, (_, i) => i * 2).filter((t) => Math.abs(t - HERO_DEADLINE_DAY) > 0);

  let delay = 250;

  return (
    <div className="panel p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">25 crates, 6,000 kg, 40 m³ from Tashkent to Istanbul</p>
          <p className="text-xs text-muted">Bars show when each option arrives. Days count from the ready date.</p>
        </div>
        <DemoBadge />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span id="hero-priority" className="text-sm font-semibold">Priority</span>
        <div role="group" aria-labelledby="hero-priority" className="flex overflow-hidden rounded border border-rule">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              aria-pressed={priority === p.value}
              onClick={() => setPriority(p.value)}
              className={`min-h-[44px] px-4 text-sm font-semibold ${priority === p.value ? "bg-ink text-white" : "bg-panel hover:bg-paper"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-4" aria-hidden>
        <div className="pointer-events-none absolute inset-y-0 left-16 right-0 z-10">
          <div className="line-drop absolute inset-y-0 w-0.5 bg-bad" style={{ left: pct(HERO_DEADLINE_DAY) }} />
          <span className="label-in absolute -top-5 -translate-x-full pr-1 text-xs font-semibold text-bad" style={{ left: pct(HERO_DEADLINE_DAY), animationDelay: "1.3s" }}>
            Deliver by day {HERO_DEADLINE_DAY}
          </span>
        </div>

        {SITE_MODES.map((mode) => {
          const rows = HERO_OFFERS.filter((o) => o.mode === mode).sort((a, b) => a.depart + a.transitDaysMin - (b.depart + b.transitDaysMin));
          return (
            <div key={mode} className="grid grid-cols-[4rem_1fr] border-t border-rule">
              <div className="py-3 pr-2"><ModeTag mode={mode} /></div>
              <div className="relative" style={{ height: rows.length * ROW + 8 }}>
                {rows.map((o, i) => {
                  const start = o.depart + o.transitDaysMin;
                  const end = o.depart + o.transitDaysMax;
                  const widthDays = Math.max(end - start, 0.6);
                  const isRec = recommended?.id === o.id;
                  const labelLeft = (start + widthDays) / HERO_AXIS_DAYS > 0.76;
                  const d = (delay += 110);
                  return (
                    <div key={o.id} className="absolute inset-x-0" style={{ top: 5 + i * ROW, height: ROW - 8 }}>
                      <div
                        className={`bar-grow absolute h-full rounded ${FILL[mode]}`}
                        style={{
                          left: pct(start),
                          width: pct(widthDays),
                          animationDelay: `${d}ms`,
                          outline: isRec ? "3px solid #111827" : "3px solid transparent",
                          outlineOffset: 2,
                          transition: "outline-color .25s ease",
                        }}
                      />
                      <span
                        className="label-in absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-sm font-bold"
                        style={{
                          animationDelay: `${d + 500}ms`,
                          ...(labelLeft
                            ? { right: `calc(100% - ${pct(start)} + 8px)` }
                            : { left: `calc(${pct(start + widthDays)} + 8px)` }),
                        }}
                      >
                        {money(o.totalPrice)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="grid grid-cols-[4rem_1fr] border-t border-rule">
          <div />
          <div className="relative h-6">
            {ticks.map((t) => (
              <span key={t} className="absolute top-1 -translate-x-1/2 text-xs text-muted" style={{ left: pct(t) }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* The same information as a table, for screen readers */}
      <div className="sr-only">
      <table>
        <caption>Demo offers: arrival window in days from the ready date, and price</caption>
        <thead><tr><th>Carrier</th><th>Mode</th><th>Arrives</th><th>Price</th></tr></thead>
        <tbody>
          {HERO_OFFERS.map((o) => (
            <tr key={o.id}>
              <td>{o.carrier}, {o.detail}</td>
              <td>{MODE_LABEL[o.mode]}</td>
              <td>day {o.depart + o.transitDaysMin} to {o.depart + o.transitDaysMax}</td>
              <td>{money(o.totalPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {recommended && (
        <p className="mt-3 text-base" aria-live="polite">
          <span className="font-bold">Recommended: </span>
          {recommended.carrier}, <span className="font-semibold">{MODE_LABEL[recommended.mode]}</span>, {money(recommended.totalPrice)}.{" "}
          <span className="text-muted">{reason}</span>
        </p>
      )}
    </div>
  );
}
