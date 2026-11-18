"use client";

import { useState, useTransition } from "react";
import { createShipment } from "@/app/actions";
import { CARGO_TYPES, DESTINATIONS, STACK_HEIGHT_M, VEHICLE_ESTIMATE, type CargoKind } from "@/lib/constants";
import { Field, toNumber } from "./Field";

export type ShipmentDefaults = {
  destination: string;
  cargoKind: CargoKind;
  weightKg: string;
  volumeM3: string;
  pieces: string;
  floorAreaM2: string;
  vehicleCount: string;
  heaviestPieceKg: string;
  isDangerousGoods: boolean;
  cargoType: string;
  commodity: string;
  readyDate: string;
  deliverBy: string;
  notes: string;
};

export function ShipmentForm({
  defaults,
  demo,
  today,
}: {
  defaults: ShipmentDefaults;
  demo: ShipmentDefaults;
  today: string;
}) {
  const [v, setV] = useState<ShipmentDefaults>(defaults);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [pending, start] = useTransition();
  const [dims, setDims] = useState({ l: "", w: "", h: "", n: "" });

  const set = <K extends keyof ShipmentDefaults>(k: K, val: ShipmentDefaults[K]) => setV((p) => ({ ...p, [k]: val }));
  const vehicles = v.cargoKind === "VEHICLES";
  const numOrNull = (s: string) => (s.trim() === "" ? null : toNumber(s));

  function applyDims() {
    const l = toNumber(dims.l), w = toNumber(dims.w), h = toNumber(dims.h), n = toNumber(dims.n);
    if ([l, w, h, n].some((x) => !Number.isFinite(x) || x <= 0)) return;
    const m3 = (l * w * h * n) / 1_000_000;
    setV((p) => ({ ...p, volumeM3: String(Math.round(m3 * 100) / 100), pieces: String(Math.round(n)) }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError("");
    start(async () => {
      const result = await createShipment({
        destination: v.destination,
        cargoKind: v.cargoKind,
        weightKg: vehicles ? null : numOrNull(v.weightKg),
        volumeM3: vehicles ? null : numOrNull(v.volumeM3),
        pieces: vehicles ? null : numOrNull(v.pieces),
        floorAreaM2: vehicles ? null : numOrNull(v.floorAreaM2),
        vehicleCount: vehicles ? numOrNull(v.vehicleCount) : null,
        heaviestPieceKg: vehicles ? null : numOrNull(v.heaviestPieceKg),
        isDangerousGoods: vehicles ? false : v.isDangerousGoods,
        cargoType: vehicles ? "Other" : v.cargoType,
        commodity: v.commodity,
        readyDate: v.readyDate,
        deliverBy: v.deliverBy,
        notes: v.notes,
      });
      // A successful call redirects to the comparison, so we only get here with an error.
      if (result && !result.ok) {
        setFormError(result.error);
        setErrors(result.fieldErrors ?? {});
      }
    });
  }

  const err = (k: string) => errors[k];
  const volumeNum = toNumber(v.volumeM3);
  const floorEstimate = Number.isFinite(volumeNum) && volumeNum > 0 ? Math.round((volumeNum / STACK_HEIGHT_M) * 10) / 10 : null;

  return (
    <form onSubmit={submit} noValidate className="panel p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Origin is fixed to Tashkent (TAS).</p>
        <button type="button" className="btn-secondary" onClick={() => { setV(demo); setErrors({}); }}>
          Load demo shipment
        </button>
      </div>

      <fieldset className="mb-6">
        <legend className="field-label">Destination</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {DESTINATIONS.map((d) => (
            <label
              key={d.code}
              className={`flex min-h-[64px] cursor-pointer items-center gap-3 rounded border px-4 py-3 ${
                v.destination === d.code ? "border-ink ring-1 ring-ink" : "border-rule hover:border-ink"
              } focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-air`}
            >
              <input type="radio" name="destination" value={d.code} checked={v.destination === d.code} onChange={() => set("destination", d.code)} className="sr-only" />
              <span className="condensed text-[28px] font-bold leading-none">{d.code}</span>
              <span className="text-sm text-muted">{d.city}</span>
            </label>
          ))}
        </div>
        {err("destination") && <p className="field-error" role="alert">{err("destination")}</p>}
      </fieldset>

      <fieldset className="mb-6">
        <legend className="field-label">What are you shipping?</legend>
        <div className="grid grid-cols-2 gap-3">
          {(["GENERAL", "VEHICLES"] as CargoKind[]).map((k) => (
            <label
              key={k}
              className={`flex min-h-[48px] cursor-pointer items-center justify-center rounded border px-3 text-sm font-semibold ${v.cargoKind === k ? "border-ink bg-ink text-white" : "border-rule bg-panel hover:border-ink"} focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-air`}
            >
              <input type="radio" name="cargoKind" className="sr-only" checked={v.cargoKind === k} onChange={() => set("cargoKind", k)} />
              {k === "GENERAL" ? "General cargo" : "Vehicles"}
            </label>
          ))}
        </div>
      </fieldset>

      {vehicles ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="vehicleCount"
            label="Number of vehicles"
            error={err("vehicleCount")}
            hint={`Weight and volume are estimated at ${VEHICLE_ESTIMATE.weightKg.toLocaleString("en-US")} kg and ${VEHICLE_ESTIMATE.volumeM3} m³ per vehicle. Only carriers that take vehicles are offered.`}
          >
            <input id="vehicleCount" inputMode="numeric" autoComplete="off" value={v.vehicleCount} onChange={(e) => set("vehicleCount", e.target.value)} aria-invalid={!!err("vehicleCount")} placeholder="4" />
          </Field>
          <Field id="commodity" label="Description of the vehicles" error={err("commodity")} hint="For example: new passenger cars.">
            <input id="commodity" value={v.commodity} onChange={(e) => set("commodity", e.target.value)} aria-invalid={!!err("commodity")} maxLength={120} />
          </Field>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="weightKg" label="Total weight (kg)" error={err("weightKg")}>
              <input id="weightKg" inputMode="decimal" autoComplete="off" value={v.weightKg} onChange={(e) => set("weightKg", e.target.value)} aria-invalid={!!err("weightKg")} placeholder="6000" />
            </Field>
            <Field id="volumeM3" label="Total volume (m³)" error={err("volumeM3")} hint="Not sure? Use the calculator below.">
              <input id="volumeM3" inputMode="decimal" autoComplete="off" value={v.volumeM3} onChange={(e) => set("volumeM3", e.target.value)} aria-invalid={!!err("volumeM3")} placeholder="40" />
            </Field>
            <Field id="pieces" label="Number of pieces" error={err("pieces")} hint="Cartons, pallets or crates.">
              <input id="pieces" inputMode="numeric" autoComplete="off" value={v.pieces} onChange={(e) => set("pieces", e.target.value)} aria-invalid={!!err("pieces")} placeholder="24" />
            </Field>
            <Field id="heaviestPieceKg" label="Heaviest piece (kg, optional)" error={err("heaviestPieceKg")} hint="Some carriers limit piece weight. Leave empty if unknown.">
              <input id="heaviestPieceKg" inputMode="decimal" autoComplete="off" value={v.heaviestPieceKg} onChange={(e) => set("heaviestPieceKg", e.target.value)} aria-invalid={!!err("heaviestPieceKg")} placeholder="800" />
            </Field>
            <Field
              id="floorAreaM2"
              label="Floor space needed (m², optional)"
              error={err("floorAreaM2")}
              hint={
                floorEstimate
                  ? `Used by carriers that price per m². If empty, we estimate ${floorEstimate} m² from the volume (stacked ${STACK_HEIGHT_M} m high).`
                  : "Used by carriers that price per m². If empty, we estimate it from the volume."
              }
              className="sm:col-span-2"
            >
              <input id="floorAreaM2" inputMode="decimal" autoComplete="off" value={v.floorAreaM2} onChange={(e) => set("floorAreaM2", e.target.value)} aria-invalid={!!err("floorAreaM2")} className="sm:max-w-[50%]" />
            </Field>
          </div>

          <details className="mt-3 rounded border border-rule px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold">Calculate volume from piece size</summary>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {([["l", "Length (cm)"], ["w", "Width (cm)"], ["h", "Height (cm)"], ["n", "Pieces"]] as const).map(([k, label]) => (
                <div key={k}>
                  <label htmlFor={`dim-${k}`} className="field-label">{label}</label>
                  <input id={`dim-${k}`} inputMode="decimal" value={dims[k]} onChange={(e) => setDims((d) => ({ ...d, [k]: e.target.value }))} />
                </div>
              ))}
              <div className="flex items-end">
                <button type="button" className="btn-secondary w-full" onClick={applyDims}>Use this volume</button>
              </div>
            </div>
            <p className="field-hint">Assumes every piece has the same size.</p>
          </details>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field id="cargoType" label="Cargo type" error={err("cargoType")}>
              <select id="cargoType" value={v.cargoType} onChange={(e) => set("cargoType", e.target.value)} aria-invalid={!!err("cargoType")}>
                {CARGO_TYPES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field id="commodity" label="Description of goods" error={err("commodity")} hint="For example: cotton garments in cartons.">
              <input id="commodity" value={v.commodity} onChange={(e) => set("commodity", e.target.value)} aria-invalid={!!err("commodity")} maxLength={120} />
            </Field>
          </div>
        </>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field id="readyDate" label="Ready date" error={err("readyDate")} hint="When the cargo can be handed to the carrier.">
          <input id="readyDate" type="date" min={today} value={v.readyDate} onChange={(e) => set("readyDate", e.target.value)} aria-invalid={!!err("readyDate")} />
        </Field>
        <Field id="deliverBy" label="Deliver by" error={err("deliverBy")} hint="Offers that arrive later are shown with the reason.">
          <input id="deliverBy" type="date" min={v.readyDate || today} value={v.deliverBy} onChange={(e) => set("deliverBy", e.target.value)} aria-invalid={!!err("deliverBy")} />
        </Field>
      </div>

      {!vehicles && (
        <label className="mt-5 flex min-h-[44px] cursor-pointer items-center gap-3">
          <input type="checkbox" checked={v.isDangerousGoods} onChange={(e) => set("isDangerousGoods", e.target.checked)} />
          <span className="text-sm font-semibold">This shipment contains dangerous goods</span>
        </label>
      )}

      <Field id="notes" label="Notes (optional)" error={err("notes")} className="mt-4">
        <textarea id="notes" rows={2} value={v.notes} onChange={(e) => set("notes", e.target.value)} maxLength={500} />
      </Field>

      {formError && (
        <p role="alert" className="mt-5 rounded border border-bad px-3 py-2 text-sm font-medium text-bad">{formError}</p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button className="btn" disabled={pending}>{pending ? "Comparing..." : "Compare options"}</button>
      </div>
    </form>
  );
}
