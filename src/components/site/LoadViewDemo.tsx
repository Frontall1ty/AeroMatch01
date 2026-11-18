"use client";

import { useState } from "react";
import type { Mode } from "@/lib/constants";
import { LoadFigures, LoadLegend, LoadView } from "@/components/LoadView";
import { int } from "@/lib/format";

const VEHICLES: { key: string; label: string; mode: Mode; equipment: string; total: number; free: number }[] = [
  { key: "truck", label: "Truck", mode: "ROAD", equipment: "Tent trailer, 82 m³", total: 22000, free: 13000 },
  { key: "plane", label: "Aircraft", mode: "AIR", equipment: "Freighter", total: 30000, free: 21000 },
  { key: "wagon", label: "Rail wagon", mode: "RAIL", equipment: "Covered wagon", total: 40000, free: 26000 },
  { key: "container", label: "Container", mode: "RAIL", equipment: "Container platform, 40 m² floor", total: 26000, free: 18000 },
  { key: "ship", label: "Ship", mode: "SEA", equipment: "Container, 40 ft", total: 45000, free: 30000 },
];

/** Pick a vehicle and move your cargo: the positions fill the way they do on every option in the app. */
export function LoadViewDemo() {
  const [i, setI] = useState(0);
  const [kg, setKg] = useState(6000);
  const v = VEHICLES[i];
  const yours = Math.min(kg, v.free);

  return (
    <div className="panel p-4 md:p-5">
      <div role="group" aria-label="Vehicle" className="flex flex-wrap overflow-hidden rounded border border-rule">
        {VEHICLES.map((x, idx) => (
          <button
            key={x.key}
            type="button"
            aria-pressed={i === idx}
            onClick={() => setI(idx)}
            className={`min-h-[44px] flex-1 whitespace-nowrap px-3 text-sm font-semibold ${i === idx ? "bg-ink text-white" : "bg-panel hover:bg-paper"}`}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <LoadView mode={v.mode} equipment={v.equipment} seed={`site-${v.key}`} total={v.total} free={v.free} yours={yours} unit="kg" size="large" className="w-full" />
      </div>
      <div className="mt-2"><LoadLegend mode={v.mode} /></div>

      <div className="mt-4">
        <label htmlFor="load-kg" className="field-label">Your cargo: {int(yours)} kg</label>
        <input
          id="load-kg"
          type="range"
          min={0}
          max={v.free}
          step={500}
          value={yours}
          onChange={(e) => setKg(Number(e.target.value))}
          className="!min-h-0 !border-0 !bg-transparent !p-0 accent-[#111827]"
        />
        <p className="field-hint">{int(v.free)} kg are free on this {v.label.toLowerCase()}. The rest is already booked by others.</p>
      </div>

      <div className="mt-4 border-t border-rule pt-4" aria-live="polite">
        <LoadFigures total={v.total} free={v.free} yours={yours} mode={v.mode} equipment={v.equipment} unit="kg" />
      </div>
      <p className="mt-3 text-xs text-muted">A drawing of how full it is, with invented references for the other bookings. Not a loading plan.</p>
    </div>
  );
}
