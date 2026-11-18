"use client";

import { useState, useTransition } from "react";
import { createShipment } from "@/app/actions";
import { CARGO_TYPES, CITIES, MODE_LABEL, STACK_HEIGHT_M, VEHICLE_ESTIMATE, destinationsFrom, modesBetween, type CargoKind } from "@/lib/constants";
import { addDays, parseDate, toInputDate } from "@/lib/dates";
import { PIECE_PRESETS, STACK_LAYERS, totalsFromPieces } from "@/lib/fit";
import { int } from "@/lib/format";
import { Field, toNumber } from "./Field";

export type ShipmentDefaults = {
  origin: string;
  destination: string;
  cargoKind: CargoKind;
  sizeMode: "PIECES" | "TOTALS";
  pieces: string;
  pieceWeightKg: string;
  pieceLengthCm: string;
  pieceWidthCm: string;
  pieceHeightCm: string;
  stackable: boolean;
  weightKg: string;
  volumeM3: string;
  floorAreaM2: string;
  heaviestPieceKg: string;
  vehicleCount: string;
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

  const set = <K extends keyof ShipmentDefaults>(k: K, val: ShipmentDefaults[K]) => setV((p) => ({ ...p, [k]: val }));
  const vehicles = v.cargoKind === "VEHICLES";
  const byPieces = !vehicles && v.sizeMode === "PIECES";
  const numOrNull = (s: string) => (s.trim() === "" ? null : toNumber(s));
  const err = (k: string) => errors[k];

  // Live totals while the shipper types the size of one piece.
  const n = toNumber(v.pieces);
  const l = toNumber(v.pieceLengthCm);
  const w = toNumber(v.pieceWidthCm);
  const h = toNumber(v.pieceHeightCm);
  const kgEach = toNumber(v.pieceWeightKg);
  const pieceOk = [n, l, w, h, kgEach].every((x) => Number.isFinite(x) && x > 0);
  const totals = pieceOk ? totalsFromPieces(n, { lengthCm: l, widthCm: w, heightCm: h, weightKg: kgEach, stackable: v.stackable }) : null;
  const volumeNum = toNumber(v.volumeM3);
  const floorEstimate = Number.isFinite(volumeNum) && volumeNum > 0 ? Math.round((volumeNum / STACK_HEIGHT_M) * 10) / 10 : null;

  function deliverInDays(days: number) {
    const base = /^\d{4}-\d{2}-\d{2}$/.test(v.readyDate) ? parseDate(v.readyDate) : parseDate(today);
    set("deliverBy", toInputDate(addDays(base, days)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError("");
    start(async () => {
      const result = await createShipment({
        origin: v.origin,
        destination: v.destination,
        cargoKind: v.cargoKind,
        weightKg: byPieces || vehicles ? null : numOrNull(v.weightKg),
        volumeM3: byPieces || vehicles ? null : numOrNull(v.volumeM3),
        pieces: vehicles ? null : numOrNull(v.pieces),
        floorAreaM2: byPieces || vehicles ? null : numOrNull(v.floorAreaM2),
        pieceLengthCm: byPieces ? numOrNull(v.pieceLengthCm) : null,
        pieceWidthCm: byPieces ? numOrNull(v.pieceWidthCm) : null,
        pieceHeightCm: byPieces ? numOrNull(v.pieceHeightCm) : null,
        pieceWeightKg: byPieces ? numOrNull(v.pieceWeightKg) : null,
        stackable: byPieces ? v.stackable : false,
        vehicleCount: vehicles ? numOrNull(v.vehicleCount) : null,
        heaviestPieceKg: byPieces || vehicles ? null : numOrNull(v.heaviestPieceKg),
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

  const radioCard = (selected: boolean) =>
    `flex min-h-[48px] cursor-pointer items-center justify-center rounded border px-3 text-sm font-semibold ${
      selected ? "border-ink bg-ink text-white" : "border-rule bg-panel hover:border-ink"
    } focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-air`;

  return (
    <form onSubmit={submit} noValidate className="panel p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Four answers are enough to compare.</p>
        <button type="button" className="btn-secondary" onClick={() => { setV({ ...demo, origin: v.origin, destination: v.destination }); setErrors({}); }}>
          Load demo shipment
        </button>
      </div>

      <div className="mb-6 max-w-sm">
        <Field id="origin" label="Where does the cargo start?" error={err("origin")}>
          <select
            id="origin"
            value={v.origin}
            onChange={(e) => {
              const origin = e.target.value;
              const options = destinationsFrom(origin);
              setV((p) => ({ ...p, origin, destination: options.some((c) => c.code === p.destination) ? p.destination : options[0].code }));
            }}
            aria-invalid={!!err("origin")}
          >
            {CITIES.map((c) => <option key={c.code} value={c.code}>{c.name}, {c.country}</option>)}
          </select>
        </Field>
      </div>

      <fieldset className="mb-6">
        <legend className="field-label">Where to?</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {destinationsFrom(v.origin).map((d) => (
            <label
              key={d.code}
              className={`flex min-h-[64px] cursor-pointer flex-col justify-center rounded border px-4 py-3 ${
                v.destination === d.code ? "border-ink ring-1 ring-ink" : "border-rule hover:border-ink"
              } focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-air`}
            >
              <input type="radio" name="destination" value={d.code} checked={v.destination === d.code} onChange={() => set("destination", d.code)} className="sr-only" />
              <span className="flex items-baseline gap-3">
                <span className="condensed text-[28px] font-bold leading-none">{d.code}</span>
                <span className="text-sm text-muted">{d.name}</span>
              </span>
              <span className="mt-1 text-xs text-muted">{modesBetween(v.origin, d.code).map((m) => MODE_LABEL[m]).join(", ")}</span>
            </label>
          ))}
        </div>
        {err("destination") && <p className="field-error" role="alert">{err("destination")}</p>}
      </fieldset>

      <fieldset className="mb-6">
        <legend className="field-label">What are you shipping?</legend>
        <div className="grid grid-cols-2 gap-3">
          {(["GENERAL", "VEHICLES"] as CargoKind[]).map((k) => (
            <label key={k} className={radioCard(v.cargoKind === k)}>
              <input type="radio" name="cargoKind" className="sr-only" checked={v.cargoKind === k} onChange={() => set("cargoKind", k)} />
              {k === "GENERAL" ? "Goods on pallets or in boxes" : "Vehicles"}
            </label>
          ))}
        </div>
      </fieldset>

      {vehicles ? (
        <Field
          id="vehicleCount"
          label="How many vehicles?"
          error={err("vehicleCount")}
          hint={`Weight and volume are estimated at ${int(VEHICLE_ESTIMATE.weightKg)} kg and ${VEHICLE_ESTIMATE.volumeM3} m³ per vehicle. Only carriers that take vehicles are offered.`}
        >
          <input id="vehicleCount" inputMode="numeric" autoComplete="off" value={v.vehicleCount} onChange={(e) => set("vehicleCount", e.target.value)} aria-invalid={!!err("vehicleCount")} placeholder="4" className="sm:max-w-[50%]" />
        </Field>
      ) : (
        <>
          <fieldset className="mb-4">
            <legend className="field-label">I know</legend>
            <div className="grid grid-cols-2 gap-3">
              <label className={radioCard(v.sizeMode === "PIECES")}>
                <input type="radio" name="sizeMode" className="sr-only" checked={v.sizeMode === "PIECES"} onChange={() => set("sizeMode", "PIECES")} />
                The size of one piece
              </label>
              <label className={radioCard(v.sizeMode === "TOTALS")}>
                <input type="radio" name="sizeMode" className="sr-only" checked={v.sizeMode === "TOTALS"} onChange={() => set("sizeMode", "TOTALS")} />
                Only the totals
              </label>
            </div>
          </fieldset>

          {byPieces ? (
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="pieces" label="How many pieces?" error={err("pieces")}>
                  <input id="pieces" inputMode="numeric" autoComplete="off" value={v.pieces} onChange={(e) => set("pieces", e.target.value)} aria-invalid={!!err("pieces")} placeholder="25" />
                </Field>
                <Field id="pieceWeightKg" label="Weight of one piece (kg)" error={err("pieceWeightKg")}>
                  <input id="pieceWeightKg" inputMode="decimal" autoComplete="off" value={v.pieceWeightKg} onChange={(e) => set("pieceWeightKg", e.target.value)} aria-invalid={!!err("pieceWeightKg")} placeholder="240" />
                </Field>
              </div>

              <div className="mt-4">
                <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
                  <span className="field-label !mb-0">Size of one piece (cm)</span>
                  <select
                    aria-label="Common sizes"
                    className="!min-h-[36px] !w-auto !py-1 text-sm"
                    value=""
                    onChange={(e) => {
                      const preset = PIECE_PRESETS[Number(e.target.value)];
                      if (!preset) return;
                      setV((p) => ({ ...p, pieceLengthCm: String(preset.box.lengthCm), pieceWidthCm: String(preset.box.widthCm), pieceHeightCm: String(preset.box.heightCm) }));
                    }}
                  >
                    <option value="">Common sizes</option>
                    {PIECE_PRESETS.map((p, i) => <option key={p.label} value={i}>{p.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {([["pieceLengthCm", "Length"], ["pieceWidthCm", "Width"], ["pieceHeightCm", "Height"]] as const).map(([k, label]) => (
                    <div key={k}>
                      <label htmlFor={k} className="sr-only">{label} (cm)</label>
                      <input id={k} inputMode="decimal" placeholder={label} value={v[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={!!err(k)} />
                    </div>
                  ))}
                </div>
                {err("pieceLengthCm") && <p className="field-error" role="alert">{err("pieceLengthCm")}</p>}
                {(err("pieceWidthCm") || err("pieceHeightCm")) && <p className="field-error" role="alert">{err("pieceWidthCm") || err("pieceHeightCm")}</p>}
              </div>

              <label className="mt-3 flex min-h-[44px] cursor-pointer items-center gap-3">
                <input type="checkbox" checked={v.stackable} onChange={(e) => set("stackable", e.target.checked)} />
                <span className="text-sm font-semibold">Pieces can be stacked {STACK_LAYERS} high</span>
              </label>

              <p aria-live="polite" className="mt-2 rounded border border-rule bg-paper px-3 py-2 text-sm">
                {totals ? (
                  <>
                    <span className="font-semibold">Your shipment:</span> {int(totals.weightKg)} kg, {totals.volumeM3} m³, about {totals.floorAreaM2} m² of floor space.
                  </>
                ) : (
                  <span className="text-muted">Enter the pieces and one piece's size to see your totals.</span>
                )}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="weightKg" label="Total weight (kg)" error={err("weightKg")}>
                <input id="weightKg" inputMode="decimal" autoComplete="off" value={v.weightKg} onChange={(e) => set("weightKg", e.target.value)} aria-invalid={!!err("weightKg")} placeholder="6000" />
              </Field>
              <Field id="volumeM3" label="Total volume (m³)" error={err("volumeM3")}>
                <input id="volumeM3" inputMode="decimal" autoComplete="off" value={v.volumeM3} onChange={(e) => set("volumeM3", e.target.value)} aria-invalid={!!err("volumeM3")} placeholder="40" />
              </Field>
              <Field id="pieces" label="Number of pieces" error={err("pieces")}>
                <input id="pieces" inputMode="numeric" autoComplete="off" value={v.pieces} onChange={(e) => set("pieces", e.target.value)} aria-invalid={!!err("pieces")} placeholder="25" />
              </Field>
            </div>
          )}
        </>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field id="readyDate" label="Ready on" error={err("readyDate")}>
          <input id="readyDate" type="date" min={today} value={v.readyDate} onChange={(e) => set("readyDate", e.target.value)} aria-invalid={!!err("readyDate")} />
        </Field>
        <Field id="deliverBy" label="Deliver by" error={err("deliverBy")}>
          <input id="deliverBy" type="date" min={v.readyDate || today} value={v.deliverBy} onChange={(e) => set("deliverBy", e.target.value)} aria-invalid={!!err("deliverBy")} />
          <div className="mt-2 flex flex-wrap gap-2">
            {[7, 14, 30].map((d) => (
              <button key={d} type="button" className="btn-secondary !min-h-[36px] !px-3" onClick={() => deliverInDays(d)}>
                {d} days after ready
              </button>
            ))}
          </div>
        </Field>
      </div>

      {!vehicles && (
        <label className="mt-5 flex min-h-[44px] cursor-pointer items-center gap-3">
          <input type="checkbox" checked={v.isDangerousGoods} onChange={(e) => set("isDangerousGoods", e.target.checked)} />
          <span className="text-sm font-semibold">This shipment contains dangerous goods</span>
        </label>
      )}

      <details className="mt-4 rounded border border-rule px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold">More details (optional)</summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {!vehicles && (
            <Field id="cargoType" label="Cargo type" error={err("cargoType")}>
              <select id="cargoType" value={v.cargoType} onChange={(e) => set("cargoType", e.target.value)} aria-invalid={!!err("cargoType")}>
                {CARGO_TYPES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          )}
          <Field id="commodity" label={vehicles ? "Description of the vehicles" : "Description of goods"} error={err("commodity")} hint={vehicles ? "For example: new passenger cars." : "For example: cotton garments in cartons."}>
            <input id="commodity" value={v.commodity} onChange={(e) => set("commodity", e.target.value)} aria-invalid={!!err("commodity")} maxLength={120} />
          </Field>
          {!vehicles && !byPieces && (
            <>
              <Field id="heaviestPieceKg" label="Heaviest piece (kg)" error={err("heaviestPieceKg")} hint="Some carriers limit piece weight.">
                <input id="heaviestPieceKg" inputMode="decimal" autoComplete="off" value={v.heaviestPieceKg} onChange={(e) => set("heaviestPieceKg", e.target.value)} aria-invalid={!!err("heaviestPieceKg")} placeholder="800" />
              </Field>
              <Field
                id="floorAreaM2"
                label="Floor space needed (m²)"
                error={err("floorAreaM2")}
                hint={floorEstimate ? `Used by carriers that price per m². If empty, we estimate ${floorEstimate} m² from the volume.` : "Used by carriers that price per m². If empty, we estimate it from the volume."}
              >
                <input id="floorAreaM2" inputMode="decimal" autoComplete="off" value={v.floorAreaM2} onChange={(e) => set("floorAreaM2", e.target.value)} aria-invalid={!!err("floorAreaM2")} />
              </Field>
            </>
          )}
          <Field id="notes" label="Notes for the carrier" error={err("notes")} className="sm:col-span-2">
            <textarea id="notes" rows={2} value={v.notes} onChange={(e) => set("notes", e.target.value)} maxLength={500} />
          </Field>
        </div>
      </details>

      {formError && (
        <p role="alert" className="mt-5 rounded border border-bad px-3 py-2 text-sm font-medium text-bad">{formError}</p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button className="btn" disabled={pending}>{pending ? "Comparing..." : "Compare options"}</button>
      </div>
    </form>
  );
}
