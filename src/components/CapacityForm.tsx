"use client";

import { useState, useTransition } from "react";
import { createListing } from "@/app/actions";
import {
  DESTINATIONS,
  LISTING_DEFAULTS,
  MODES_BY_DESTINATION,
  MODE_LABEL,
  MODE_ORDER,
  PRICING_UNIT_LABEL,
  PRICING_UNITS_BY_MODE,
  type CargoKind,
  type Mode,
  type PricingUnit,
} from "@/lib/constants";
import { addDays, formatDay, parseDate, toInputDate } from "@/lib/dates";
import { valuesForMode, type ListingValues } from "@/lib/listingValues";
import { Field, toNumber } from "./Field";
import { SpaceCalculator } from "./SpaceCalculator";

const PRICE_LABEL: Record<PricingUnit, string> = {
  PER_KG: "Price per chargeable kg (USD)",
  PER_M2: "Price per m² of floor space (USD)",
  FLAT: "Flat price for the whole truck or wagon (USD)",
  PER_VEHICLE: "Price per vehicle (USD)",
};
const PRICE_HINT: Record<PricingUnit, string> = {
  PER_KG: "Chargeable weight is the larger of actual and volumetric weight.",
  PER_M2: "The shipper's floor space is entered by them, or estimated from volume.",
  FLAT: "One price however much the shipment weighs, as long as it fits.",
  PER_VEHICLE: "Multiplied by the number of vehicles.",
};
const PRICE_SHORT: Record<PricingUnit, string> = {
  PER_KG: "per kg",
  PER_M2: "per m²",
  FLAT: "flat",
  PER_VEHICLE: "per vehicle",
};

export function CapacityForm({
  initial,
  last,
  today,
  justPublished,
}: {
  initial: ListingValues;
  last: ListingValues | null;
  today: string;
  justPublished: boolean;
}) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [pending, start] = useTransition();

  const set = <K extends keyof ListingValues>(k: K, val: ListingValues[K]) => setV((p) => ({ ...p, [k]: val }));
  const err = (k: string) => errors[k];
  const allowedModes = (dest: string) => MODES_BY_DESTINATION[dest] ?? [];
  const vehicles = v.cargoKind === "VEHICLES";

  function chooseMode(mode: Mode) {
    const dest = allowedModes(v.destination).includes(mode) ? v.destination : "IST";
    const kind: CargoKind = mode === "AIR" ? "GENERAL" : v.cargoKind;
    const unit = PRICING_UNITS_BY_MODE[mode].includes(v.pricingUnit) ? v.pricingUnit : "PER_KG";
    setV(valuesForMode(mode, dest, v.departureDate, kind, kind === "VEHICLES" ? undefined : unit));
  }

  function chooseDestination(dest: string) {
    const mode = allowedModes(dest).includes(v.mode) ? v.mode : "AIR";
    setV((p) => (mode === p.mode ? { ...p, destination: dest } : valuesForMode(mode, dest, p.departureDate)));
  }

  function chooseKind(kind: CargoKind) {
    setV(valuesForMode(v.mode, v.destination, v.departureDate, kind, "PER_KG"));
  }

  function choosePricing(unit: PricingUnit) {
    const d = LISTING_DEFAULTS[v.mode];
    setV((p) => ({
      ...p,
      pricingUnit: unit,
      unitPrice: String(d.price[unit]),
      availableFloorM2: unit === "PER_M2" ? p.availableFloorM2 || String(d.floorM2) : p.availableFloorM2,
    }));
  }

  function duplicateLast() {
    if (!last) return;
    // Same route and terms, departing a week after the last one (never in the past).
    const next = addDays(parseDate(last.departureDate), 7);
    const earliest = parseDate(today);
    setV({ ...last, departureDate: toInputDate(next < earliest ? addDays(earliest, 7) : next) });
    setErrors({});
  }

  const numOrNull = (s: string) => (s.trim() === "" ? null : toNumber(s));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError("");
    start(async () => {
      const result = await createListing({
        mode: v.mode,
        destination: v.destination,
        cargoKind: v.cargoKind,
        pricingUnit: v.pricingUnit,
        departureDate: v.departureDate,
        unitPrice: toNumber(v.unitPrice),
        availableWeightKg: vehicles ? null : numOrNull(v.availableWeightKg),
        availableVolumeM3: vehicles ? null : numOrNull(v.availableVolumeM3),
        availableFloorM2: vehicles ? null : numOrNull(v.availableFloorM2),
        availableVehicles: vehicles ? numOrNull(v.availableVehicles) : null,
        transitDaysMin: toNumber(v.transitDaysMin),
        transitDaysMax: toNumber(v.transitDaysMax),
        equipment: v.equipment,
        cutoffHours: toNumber(v.cutoffHours),
        maxPieceKg: vehicles ? null : numOrNull(v.maxPieceKg),
        acceptsDangerousGoods: v.acceptsDangerousGoods,
        minChargeableKg: toNumber(v.minChargeableKg) || 0,
        restrictions: v.restrictions,
      });
      if (result && !result.ok) {
        setFormError(result.error);
        setErrors(result.fieldErrors ?? {});
      }
    });
  }

  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(v.departureDate);
  const arrives = dateOk
    ? `${formatDay(addDays(parseDate(v.departureDate), Number(v.transitDaysMin) || 0))} to ${formatDay(addDays(parseDate(v.departureDate), Number(v.transitDaysMax) || 0))}`
    : "";
  const price = toNumber(v.unitPrice);
  const capacityText = vehicles
    ? `${v.availableVehicles || 0} vehicle slots`
    : `${v.availableWeightKg || 0} kg, ${v.availableVolumeM3 || 0} m³${v.pricingUnit === "PER_M2" && v.availableFloorM2 ? `, ${v.availableFloorM2} m² floor` : ""}`;
  const priceText = Number.isFinite(price)
    ? v.pricingUnit === "FLAT"
      ? `$${price.toLocaleString("en-US")} flat`
      : `$${price.toLocaleString("en-US")} ${PRICE_SHORT[v.pricingUnit]}`
    : "";

  return (
    <form onSubmit={submit} noValidate className="panel p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Origin is fixed to Tashkent (TAS). Fields are pre-filled. Change what differs.</p>
        <button type="button" className="btn-secondary" onClick={duplicateLast} disabled={!last}>
          Duplicate last listing
        </button>
      </div>
      {!last && <p className="-mt-2 mb-4 text-xs text-muted">Duplicate becomes available after you publish a listing.</p>}

      <fieldset className="mb-5">
        <legend className="field-label">Mode</legend>
        <div className="grid grid-cols-3 gap-3">
          {MODE_ORDER.map((m) => (
            <label
              key={m}
              className={`flex min-h-[48px] cursor-pointer items-center justify-center rounded border px-3 text-sm font-semibold ${v.mode === m ? "border-ink bg-ink text-white" : "border-rule bg-panel hover:border-ink"} focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-air`}
            >
              <input type="radio" name="mode" className="sr-only" checked={v.mode === m} onChange={() => chooseMode(m)} />
              {MODE_LABEL[m]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="destination" label="Destination" error={err("destination")}>
          <select id="destination" value={v.destination} onChange={(e) => chooseDestination(e.target.value)} aria-invalid={!!err("destination")}>
            {DESTINATIONS.filter((d) => allowedModes(d.code).includes(v.mode)).map((d) => (
              <option key={d.code} value={d.code}>{d.code} · {d.city}</option>
            ))}
          </select>
        </Field>
        <Field id="departureDate" label="Departure date" error={err("departureDate")}>
          <input id="departureDate" type="date" min={today} value={v.departureDate} onChange={(e) => set("departureDate", e.target.value)} aria-invalid={!!err("departureDate")} />
          <div className="mt-2 flex flex-wrap gap-2">
            {[1, 3, 7].map((n) => (
              <button key={n} type="button" className="btn-secondary !min-h-[36px] !px-3" onClick={() => set("departureDate", toInputDate(addDays(parseDate(today), n)))}>
                {n === 1 ? "Tomorrow" : `In ${n} days`}
              </button>
            ))}
          </div>
        </Field>

        {v.mode !== "AIR" && (
          <Field id="cargoKind" label="Cargo you carry" error={err("cargoKind")} hint="Choose Vehicles for car carriers.">
            <select id="cargoKind" value={v.cargoKind} onChange={(e) => chooseKind(e.target.value as CargoKind)}>
              <option value="GENERAL">General cargo</option>
              <option value="VEHICLES">Vehicles</option>
            </select>
          </Field>
        )}
        {!vehicles && PRICING_UNITS_BY_MODE[v.mode].length > 1 && (
          <Field id="pricingUnit" label="How you price" error={err("pricingUnit")} hint="Each carrier sets its own pricing.">
            <select id="pricingUnit" value={v.pricingUnit} onChange={(e) => choosePricing(e.target.value as PricingUnit)}>
              {PRICING_UNITS_BY_MODE[v.mode].filter((u) => u !== "PER_VEHICLE").map((u) => (
                <option key={u} value={u}>{PRICING_UNIT_LABEL[u]}</option>
              ))}
            </select>
          </Field>
        )}

        <Field id="unitPrice" label={PRICE_LABEL[v.pricingUnit]} error={err("unitPrice")} hint={PRICE_HINT[v.pricingUnit]}>
          <input id="unitPrice" inputMode="decimal" value={v.unitPrice} onChange={(e) => set("unitPrice", e.target.value)} aria-invalid={!!err("unitPrice")} />
        </Field>
        <Field id="equipment" label="Equipment" error={err("equipment")}>
          <input id="equipment" list="equipment-options" value={v.equipment} onChange={(e) => set("equipment", e.target.value)} aria-invalid={!!err("equipment")} />
          <datalist id="equipment-options">
            {(vehicles ? [LISTING_DEFAULTS[v.mode].vehicleEquipment] : LISTING_DEFAULTS[v.mode].equipment).map((e) => <option key={e} value={e} />)}
          </datalist>
        </Field>

        {vehicles ? (
          <Field id="availableVehicles" label="Vehicles you can carry" error={err("availableVehicles")}>
            <input id="availableVehicles" inputMode="numeric" value={v.availableVehicles} onChange={(e) => set("availableVehicles", e.target.value)} aria-invalid={!!err("availableVehicles")} />
          </Field>
        ) : (
          <>
            {v.pricingUnit === "PER_M2" && (
              <Field id="availableFloorM2" label="Floor space you can sell (m²)" error={err("availableFloorM2")}>
                <input id="availableFloorM2" inputMode="decimal" value={v.availableFloorM2} onChange={(e) => set("availableFloorM2", e.target.value)} aria-invalid={!!err("availableFloorM2")} />
              </Field>
            )}
            <Field id="availableWeightKg" label="Weight you can carry (kg)" error={err("availableWeightKg")}>
              <input id="availableWeightKg" inputMode="decimal" value={v.availableWeightKg} onChange={(e) => set("availableWeightKg", e.target.value)} aria-invalid={!!err("availableWeightKg")} />
            </Field>
            <Field id="availableVolumeM3" label="Volume you can carry (m³)" error={err("availableVolumeM3")}>
              <input id="availableVolumeM3" inputMode="decimal" value={v.availableVolumeM3} onChange={(e) => set("availableVolumeM3", e.target.value)} aria-invalid={!!err("availableVolumeM3")} />
            </Field>
          </>
        )}

        <Field id="transitDaysMin" label="Fastest transit (days)" error={err("transitDaysMin")}>
          <input id="transitDaysMin" inputMode="numeric" value={v.transitDaysMin} onChange={(e) => set("transitDaysMin", e.target.value)} aria-invalid={!!err("transitDaysMin")} />
        </Field>
        <Field id="transitDaysMax" label="Slowest transit (days)" error={err("transitDaysMax")}>
          <input id="transitDaysMax" inputMode="numeric" value={v.transitDaysMax} onChange={(e) => set("transitDaysMax", e.target.value)} aria-invalid={!!err("transitDaysMax")} />
        </Field>
      </div>

      {!vehicles && v.mode !== "AIR" && (
        <SpaceCalculator
          onUse={({ floorM2, volumeM3 }) =>
            setV((p) => ({ ...p, availableFloorM2: String(floorM2), availableVolumeM3: String(volumeM3) }))
          }
        />
      )}

      <details className="mt-5 rounded border border-rule px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold">More details (cutoff, limits, restrictions)</summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field id="cutoffHours" label="Acceptance cutoff (hours before departure)" error={err("cutoffHours")}>
            <input id="cutoffHours" inputMode="numeric" value={v.cutoffHours} onChange={(e) => set("cutoffHours", e.target.value)} aria-invalid={!!err("cutoffHours")} />
          </Field>
          {!vehicles && (
            <>
              <Field id="maxPieceKg" label="Max piece weight (kg)" error={err("maxPieceKg")}>
                <input id="maxPieceKg" inputMode="decimal" value={v.maxPieceKg} onChange={(e) => set("maxPieceKg", e.target.value)} aria-invalid={!!err("maxPieceKg")} />
              </Field>
              {v.pricingUnit === "PER_KG" && (
                <Field id="minChargeableKg" label="Minimum chargeable weight (kg)" error={err("minChargeableKg")}>
                  <input id="minChargeableKg" inputMode="decimal" value={v.minChargeableKg} onChange={(e) => set("minChargeableKg", e.target.value)} aria-invalid={!!err("minChargeableKg")} />
                </Field>
              )}
              <label className="flex min-h-[44px] cursor-pointer items-center gap-3 self-end">
                <input type="checkbox" checked={v.acceptsDangerousGoods} onChange={(e) => set("acceptsDangerousGoods", e.target.checked)} />
                <span className="text-sm font-semibold">Accepts dangerous goods</span>
              </label>
            </>
          )}
          <Field id="restrictions" label="Restrictions (optional)" error={err("restrictions")} className="sm:col-span-2">
            <input id="restrictions" value={v.restrictions} onChange={(e) => set("restrictions", e.target.value)} maxLength={200} aria-invalid={!!err("restrictions")} />
          </Field>
        </div>
      </details>

      {dateOk && Number.isFinite(price) && (
        <p className="mt-5 rounded border border-rule bg-paper px-3 py-2 text-sm">
          <span className="font-semibold">Shippers will see:</span> {MODE_LABEL[v.mode]}, TAS to {v.destination}, departs {formatDay(parseDate(v.departureDate))}, arrives {arrives}, {priceText}, {capacityText} left.
        </p>
      )}

      {formError && (
        <p role="alert" className="mt-4 rounded border border-bad px-3 py-2 text-sm font-medium text-bad">{formError}</p>
      )}

      <div className="mt-5">
        <button className="btn" disabled={pending}>{pending ? "Publishing..." : "Add capacity"}</button>
      </div>
      {justPublished && <span className="sr-only" role="status">Capacity added.</span>}
    </form>
  );
}
