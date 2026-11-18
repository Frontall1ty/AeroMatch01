"use client";

import { useState } from "react";
import { MODE_LABEL, type Mode, type PricingUnit } from "@/lib/constants";
import { money } from "@/lib/format";
import { priceFor, type PricingShipment } from "@/lib/rules";
import { DemoBadge, ModeTag } from "@/components/ui";
import { CountUp } from "./CountUp";

const CRATES: PricingShipment = { cargoKind: "GENERAL", weightKg: 6000, volumeM3: 40, floorAreaM2: 22.2 };
const CARS: PricingShipment = { cargoKind: "VEHICLES", weightKg: 6000, volumeM3: 48, vehicleCount: 4 };

const CASES: {
  unit: PricingUnit;
  tab: string;
  mode: Mode;
  carrier: string;
  equipment: string;
  price: number;
  minChargeableKg: number;
  shipmentLabel: string;
  shipment: PricingShipment;
  why: string;
}[] = [
  { unit: "PER_KG", tab: "Per kg", mode: "AIR", carrier: "Demo Air Cargo A", equipment: "Freighter", price: 2.6, minChargeableKg: 100, shipmentLabel: "25 crates, 6,000 kg, 40 m³", shipment: CRATES, why: "Air sells weight. The carrier charges the larger of actual and volumetric weight, so 40 m³ counts as 6,680 kg." },
  { unit: "PER_M2", tab: "Per m²", mode: "ROAD", carrier: "Demo Trucking Co", equipment: "Groupage trailer", price: 200, minChargeableKg: 0, shipmentLabel: "25 crates, 22.2 m² of floor", shipment: CRATES, why: "A shared trailer sells floor space. You pay for the square metres your crates take, not the whole truck." },
  { unit: "FLAT", tab: "Whole truck", mode: "ROAD", carrier: "Demo Trucking Co", equipment: "Tent trailer, 82 m³", price: 4800, minChargeableKg: 0, shipmentLabel: "25 crates, 6,000 kg, 40 m³", shipment: CRATES, why: "A full truck or wagon is one price, as long as the cargo fits." },
  { unit: "PER_VEHICLE", tab: "Per vehicle", mode: "ROAD", carrier: "Demo Trucking Co", equipment: "Car carrier", price: 900, minChargeableKg: 0, shipmentLabel: "4 vehicles", shipment: CARS, why: "Car carriers charge per vehicle. When you ship vehicles, only these carriers are offered." },
];

/** Each carrier prices in its own way. The same rules that price real offers in the demo. */
export function PricingDemo() {
  const [i, setI] = useState(0);
  const c = CASES[i];
  const result = priceFor({ mode: c.mode, pricingUnit: c.unit, unitPrice: c.price, minChargeableKg: c.minChargeableKg, shipment: c.shipment });

  return (
    <div className="panel p-4 md:p-5">
      <div role="group" aria-label="How a carrier prices" className="flex flex-wrap overflow-hidden rounded border border-rule">
        {CASES.map((x, idx) => (
          <button
            key={x.unit}
            type="button"
            aria-pressed={i === idx}
            onClick={() => setI(idx)}
            className={`min-h-[44px] flex-1 whitespace-nowrap px-4 text-sm font-semibold ${i === idx ? "bg-ink text-white" : "bg-panel hover:bg-paper"}`}
          >
            {x.tab}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4" aria-live="polite">
        <div>
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <ModeTag mode={c.mode} /> <span className="text-muted">{c.carrier}, {c.equipment}</span>
          </p>
          <p className="mt-3 text-sm text-muted">{c.shipmentLabel}</p>
          <p className="mt-1 text-sm font-semibold">{result.basis}</p>
        </div>
        <div className="text-right">
          <p className="condensed text-[56px] font-bold leading-none">
            $<CountUp value={result.total} />
          </p>
          <DemoBadge />
        </div>
      </div>

      <p className="mt-4 border-t border-rule pt-3 text-sm text-muted">{c.why}</p>
      <p className="mt-1 sr-only">{MODE_LABEL[c.mode]} price {money(result.total)}</p>
    </div>
  );
}
