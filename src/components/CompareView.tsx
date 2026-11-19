"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cityName, MODE_LABEL, MODE_ORDER, SAFETY_NOTE, VEHICLE_ESTIMATE, type Mode } from "@/lib/constants";
import { addDays, formatDay } from "@/lib/dates";
import { int, kg, m3, money } from "@/lib/format";
import type { OfferView } from "@/lib/offers";
import { labelOffers, recommend, recommendationReason, type OfferLabel, type Priority } from "@/lib/rules";
import { BookingDrawer, type ShipmentSummary } from "./BookingDrawer";
import { LaneChart } from "./LaneChart";
import { LoadView } from "./LoadView";
import { SpaceBar } from "./SpaceBar";
import { DemoBadge, EmptyState, ModeTag, VerifiedBadge } from "./ui";
import { VehicleArt } from "./VehicleArt";

type Breakdown = Record<Mode, { actualKg: number; volumetricKg: number; chargedKg: number }>;

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "CHEAPEST", label: "Cheapest" },
  { value: "FASTEST", label: "Fastest" },
  { value: "SAFEST", label: "Safest" },
  { value: "BALANCED", label: "Balanced" },
];

const LABEL_TEXT: Record<OfferLabel, string> = { CHEAPEST: "Cheapest", FASTEST: "Fastest", SAFEST: "Safest" };
const TILE_COLUMNS: Record<number, string> = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" };

const arrivalText = (o: OfferView) =>
  o.arrivalMinDate === o.arrivalMaxDate
    ? formatDay(new Date(o.arrivalMinDate))
    : `${formatDay(new Date(o.arrivalMinDate))} to ${formatDay(new Date(o.arrivalMaxDate))}`;

const transitText = (min: number, max: number) => (min === max ? `${min} ${min === 1 ? "day" : "days"}` : `${min} to ${max} days`);

/** Handling safety as five dots. A demo estimate, and the page says so. */
export function SafetyDots({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`Handling safety ${score} of 5 (demo estimate)`} title={SAFETY_NOTE}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} aria-hidden className={`h-2 w-2 rounded-full border border-ink ${i < score ? "bg-ink" : "bg-panel"}`} />
      ))}
    </span>
  );
}

function Labels({ labels, recommended }: { labels: OfferLabel[]; recommended: boolean }) {
  if (!recommended && labels.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {recommended && <span className="rounded bg-ink px-1.5 py-0.5 text-xs font-semibold text-white">Recommended</span>}
      {labels.map((l) => (
        <span key={l} className="rounded border border-ink px-1.5 py-0.5 text-xs font-semibold">{LABEL_TEXT[l]}</span>
      ))}
    </div>
  );
}

function spaceFor(o: OfferView, shipment: ShipmentSummary) {
  return o.cargoKind === "VEHICLES"
    ? { total: o.capacityVehicles, free: o.availableVehicles ?? 0, yours: shipment.vehicleCount ?? 0, unit: "slots" as const }
    : { total: o.capacityWeightKg, free: o.availableWeightKg, yours: shipment.weightKg, unit: "kg" as const };
}

export function CompareView({
  shipment,
  offers,
  breakdown,
  deadlineDay,
  initialMode = null,
}: {
  shipment: ShipmentSummary;
  offers: OfferView[];
  breakdown: Breakdown;
  deadlineDay: number;
  /** The way the shipper picked before entering the cargo. Opens on it only if one of its offers fits. */
  initialMode?: Mode | null;
}) {
  const preferredFits = initialMode !== null && offers.some((o) => o.mode === initialMode && o.status === "OK");
  const [priority, setPriority] = useState<Priority>("BALANCED");
  const [modeFilter, setModeFilter] = useState<Mode | null>(preferredFits ? initialMode : null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Only the modes that exist on this lane. Sea never appears for an inland city.
  const modes = useMemo(() => MODE_ORDER.filter((m) => offers.some((o) => o.mode === m)), [offers]);

  const visible = useMemo(() => (modeFilter ? offers.filter((o) => o.mode === modeFilter) : offers), [offers, modeFilter]);
  const ok = useMemo(() => visible.filter((o) => o.status === "OK"), [visible]);
  const notOk = useMemo(() => visible.filter((o) => o.status !== "OK"), [visible]);
  const allOk = useMemo(() => offers.filter((o) => o.status === "OK"), [offers]);

  const { recommended } = useMemo(() => recommend(ok, priority), [ok, priority]);
  const reason = recommended ? recommendationReason(recommended, ok, priority) : "";
  const labels = useMemo(() => labelOffers(ok), [ok]);

  const sorted = useMemo(
    () => [...ok].sort((a, b) => (a.id === recommended?.id ? -1 : b.id === recommended?.id ? 1 : a.totalPrice - b.totalPrice)),
    [ok, recommended],
  );

  // What each mode offers for this shipment, for the mode selector.
  const tiles = useMemo(
    () =>
      modes.map((m) => {
        const all = offers.filter((o) => o.mode === m);
        const fit = all.filter((o) => o.status === "OK");
        return {
          mode: m,
          fitCount: fit.length,
          total: all.length,
          from: fit.length ? Math.min(...fit.map((o) => o.totalPrice)) : null,
          minDays: fit.length ? Math.min(...fit.map((o) => o.transitDaysMin)) : null,
          maxDays: fit.length ? Math.max(...fit.map((o) => o.transitDaysMax)) : null,
          safety: fit.length ? Math.max(...fit.map((o) => o.safetyScore)) : all.length ? Math.max(...all.map((o) => o.safetyScore)) : 3,
          equipment: (fit[0] ?? all[0])?.equipment ?? "",
          vehicles: (fit[0] ?? all[0])?.cargoKind === "VEHICLES",
        };
      }),
    [modes, offers],
  );

  // Offers that only miss the deadline: how far would the deadline need to move?
  const nearMisses = notOk.filter((o) => o.reasons.every((r) => r.code === "MISSES_DEADLINE"));
  const minExtension = nearMisses.length ? Math.min(...nearMisses.map((o) => o.arrivalMaxDay - deadlineDay)) : 0;

  const bookingOffer = offers.find((o) => o.id === bookingId) ?? null;

  function select(id: string) {
    setActiveId(id);
    document.getElementById(`row-${id}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  return (
    <div>
      {/* Route header: the bold element of the screen */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <span className="condensed text-5xl font-bold leading-none md:text-[56px]">{shipment.origin}</span>
          <span aria-hidden className="relative h-4 flex-1">
            <span className="route-line absolute left-0 right-1 top-1/2 h-0.5 -translate-y-1/2 bg-ink" />
            <span className="route-head absolute right-0 top-1/2 h-0 w-0 -translate-y-1/2 border-y-[7px] border-l-[12px] border-y-transparent border-l-ink" />
          </span>
          <span className="condensed text-5xl font-bold leading-none md:text-[56px]">{shipment.destination}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm text-muted">
          <span>{cityName(shipment.origin)}</span>
          <span>{cityName(shipment.destination)}</span>
        </div>
      </div>

      {/* Step 1: choose how to send it. Everything below follows. */}
      <section aria-labelledby="how" className="mb-6">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="how" className="text-xl font-semibold">How do you want to send it?</h2>
          {modeFilter && (
            <button type="button" className="text-sm font-semibold underline underline-offset-2 hover:no-underline" onClick={() => setModeFilter(null)}>
              Show all modes
            </button>
          )}
        </div>
        <div className={`grid grid-cols-2 gap-3 ${TILE_COLUMNS[Math.min(4, Math.max(1, tiles.length))]}`}>
          {tiles.map((t) => {
            const selected = modeFilter === t.mode;
            const none = t.fitCount === 0;
            return (
              <button
                key={t.mode}
                type="button"
                aria-pressed={selected}
                onClick={() => setModeFilter(selected ? null : t.mode)}
                className={`flex min-w-0 flex-col rounded border p-3 text-left ${
                  selected ? "border-ink ring-2 ring-ink" : "border-rule hover:border-ink"
                } bg-panel`}
              >
                <VehicleArt mode={t.mode} equipment={t.equipment} vehicles={t.vehicles} className="h-10 w-full max-w-[120px]" label={false} />
                <span className="mt-2 flex items-center justify-between gap-2">
                  <ModeTag mode={t.mode} />
                  <SafetyDots score={t.safety} />
                </span>
                {none ? (
                  <span className="mt-2 text-sm font-semibold text-bad">No option fits</span>
                ) : (
                  <>
                    <span className="mt-2 text-base font-bold">from {money(t.from!)}</span>
                    <span className="text-sm text-muted">{transitText(t.minDays!, t.maxDays!)}</span>
                  </>
                )}
                <span className="mt-1 text-xs text-muted">
                  {t.fitCount} of {t.total} {t.total === 1 ? "option fits" : "options fit"}
                </span>
              </button>
            );
          })}
        </div>
        {initialMode && !preferredFits && (
          <p role="status" className="mt-3 rounded border border-rule bg-panel px-3 py-2 text-sm">
            You picked {MODE_LABEL[initialMode].toLowerCase()}, but no {MODE_LABEL[initialMode].toLowerCase()} option fits this shipment, so every way that does is shown.
          </p>
        )}
        <p className="mt-2 text-xs text-muted">{SAFETY_NOTE} Prices are demo data.</p>
      </section>

      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto]">
        <details className="panel p-3">
          <summary className="cursor-pointer text-sm font-semibold">How the charged weight is worked out</summary>
          {shipment.cargoKind === "VEHICLES" ? (
            <p className="mt-2 text-sm">
              {shipment.vehicleCount} {shipment.vehicleCount === 1 ? "vehicle" : "vehicles"}. Only carriers that take vehicles are offered, priced per vehicle.
              Weight and volume are estimated at {int(VEHICLE_ESTIMATE.weightKg)} kg and {VEHICLE_ESTIMATE.volumeM3} m³ per vehicle.
            </p>
          ) : (
            <>
              <div className="mt-2 grid gap-2 sm:grid-cols-4">
                {modes.map((m) => (
                  <div key={m} className="text-sm">
                    <ModeTag mode={m} />
                    <p className="text-muted">Actual {int(breakdown[m].actualKg)} kg / Volumetric {int(breakdown[m].volumetricKg)} kg</p>
                    <p className="font-semibold">Charged {int(breakdown[m].chargedKg)} kg</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                Each carrier sets its own pricing: per kg, per m² of floor space, a flat price or per vehicle. The price on each option shows how it is calculated.
              </p>
            </>
          )}
        </details>

        <div className="panel p-3">
          <p id="priority-label" className="mb-2 text-sm font-semibold">What matters most</p>
          <div role="group" aria-labelledby="priority-label" className="flex overflow-hidden rounded border border-rule">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                aria-pressed={priority === p.value}
                onClick={() => setPriority(p.value)}
                className={`min-h-[44px] flex-1 px-3 text-sm font-semibold ${priority === p.value ? "bg-ink text-white" : "bg-panel hover:bg-paper"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {ok.length === 0 ? (
        <EmptyState title={modeFilter ? `No ${MODE_LABEL[modeFilter].toLowerCase()} option fits your shipment` : "No option meets your shipment and deadline"}>
          {nearMisses.length > 0
            ? `Move your deliver-by date later by ${minExtension} ${minExtension === 1 ? "day" : "days"} to see ${nearMisses.length} more ${nearMisses.length === 1 ? "option" : "options"}. `
            : modeFilter && allOk.length > 0
              ? "Another mode has options. Choose Show all modes. "
              : "Try a different destination, a later deliver-by date or a smaller shipment. "}
          The reasons are listed below.
        </EmptyState>
      ) : (
        <>
          <LaneChart
            modes={modeFilter ? [modeFilter] : modes}
            offers={ok}
            readyDate={shipment.readyDate}
            deadlineDay={deadlineDay}
            deadlineDate={shipment.deliverBy}
            recommendedId={recommended?.id ?? null}
            activeId={activeId}
            onActive={setActiveId}
            onSelect={select}
          />

          {recommended && (
            <p className="mt-4 text-base" aria-live="polite">
              <span className="font-bold">Recommended: </span>
              {recommended.carrierName}, <span className="font-semibold">{MODE_LABEL[recommended.mode]}</span>, {money(recommended.totalPrice)}, arrives {arrivalText(recommended)}.{" "}
              <span className="text-muted">{reason}</span>
            </p>
          )}

          <h2 className="mb-2 mt-6 flex flex-wrap items-center gap-2 text-xl font-semibold">
            Options that fit <DemoBadge />
          </h2>
          <ul className="panel divide-y divide-rule">
            {sorted.map((o) => {
              const space = spaceFor(o, shipment);
              return (
                <li
                  key={o.id}
                  id={`row-${o.id}`}
                  onMouseEnter={() => setActiveId(o.id)}
                  onMouseLeave={() => setActiveId(null)}
                  className={`grid gap-x-4 gap-y-3 p-4 md:grid-cols-[10.5rem_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)] ${activeId === o.id ? "bg-[#EEF2F7]" : ""}`}
                >
                  <div className="flex items-start gap-3 md:block">
                    <LoadView mode={o.mode} equipment={o.equipment} seed={o.id} total={space.total} free={space.free} yours={space.yours} unit={space.unit} className="w-40 md:w-full" />
                    <div className="md:mt-1"><ModeTag mode={o.mode} /></div>
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold">{o.carrierName}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">{o.carrierVerified && <VerifiedBadge />}</div>
                    <p className="mt-1 text-sm text-muted">{o.equipment}</p>
                    {o.restrictions && <p className="text-xs text-muted">{o.restrictions}</p>}
                    <Labels labels={labels.get(o.id) ?? []} recommended={o.id === recommended?.id} />
                  </div>

                  <dl className="text-sm">
                    <dt className="text-xs text-muted">Departs</dt>
                    <dd className="font-semibold">{formatDay(new Date(o.departureDate))}</dd>
                    <dt className="mt-2 text-xs text-muted">Arrives</dt>
                    <dd>{arrivalText(o)} <span className="text-muted">({transitText(o.transitDaysMin, o.transitDaysMax)})</span></dd>
                    <dt className="mt-2 text-xs text-muted">Hand over {o.cutoffHours} h before departure</dt>
                  </dl>

                  <div className="min-w-0">
                    <p className="mb-1 text-xs text-muted">Free space</p>
                    <SpaceBar mode={o.mode} total={space.total} free={space.free} yours={space.yours} unit={space.unit} />
                    {o.cargoKind !== "VEHICLES" && (
                      <p className="mt-1 text-xs text-muted">
                        {m3(o.availableVolumeM3)}{o.availableFloorM2 != null ? `, ${o.availableFloorM2} m² floor` : ""}
                      </p>
                    )}
                    {o.piecesFit != null && <p className="mt-0.5 text-xs font-semibold text-good">Room for {o.piecesFit} pieces like yours</p>}
                  </div>

                  <div className="md:text-right">
                    <p className="text-2xl font-bold leading-none">{money(o.totalPrice)}</p>
                    <p className="mt-1 text-xs text-muted">{o.priceBasis}</p>
                    <p className="mt-2 flex items-center gap-2 text-xs md:justify-end">
                      <span className="text-muted">Safety</span> <SafetyDots score={o.safetyScore} />
                    </p>
                    <button className="btn mt-3 w-full md:w-auto" onClick={() => setBookingId(o.id)}>Request booking</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Not available, with reasons */}
      {notOk.length > 0 && (
        <details className="panel mt-6 p-4" open={ok.length === 0}>
          <summary className="cursor-pointer text-base font-semibold">Not available for this shipment ({notOk.length})</summary>
          <ul className="mt-3 divide-y divide-rule">
            {notOk.map((o) => (
              <li key={o.id} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <VehicleArt mode={o.mode} equipment={o.equipment} vehicles={o.cargoKind === "VEHICLES"} className="hidden h-8 w-16 opacity-60 sm:block" label={false} />
                  <div>
                    <p className="font-semibold">
                      {o.carrierName} <span className="font-normal text-muted">· {o.equipment} · departs {formatDay(new Date(o.departureDate))}</span>
                    </p>
                    <div className="mt-1"><ModeTag mode={o.mode} /></div>
                  </div>
                </div>
                <ul className="max-w-md text-bad">
                  {o.reasons.map((r) => (
                    <li key={r.code} className="font-medium">
                      {r.text}
                      {r.code === "MISSES_DEADLINE" && (
                        <span className="block text-xs font-normal text-muted">
                          A deliver-by date of {formatDay(addDays(new Date(o.departureDate), o.transitDaysMax))} would fit.
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </details>
      )}

      {bookingOffer && <BookingDrawer offer={bookingOffer} shipment={shipment} onClose={() => setBookingId(null)} />}
    </div>
  );
}

export function ShipmentRail({ shipment }: { shipment: ShipmentSummary & { cargoType: string } }) {
  const row = (label: string, value: string) => (
    <div className="flex justify-between gap-3 border-b border-rule py-1.5 last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
  const vehicles = shipment.cargoKind === "VEHICLES";
  return (
    <aside aria-label="Shipment summary" className="panel p-4 lg:sticky lg:top-4">
      <h2 className="mb-2 text-xl font-semibold">Shipment</h2>
      <dl className="text-sm">
        {row("From", cityName(shipment.origin))}
        {row("To", cityName(shipment.destination))}
        {vehicles ? (
          row("Vehicles", int(shipment.vehicleCount ?? 0))
        ) : (
          <>
            {row("Weight", kg(shipment.weightKg))}
            {row("Volume", m3(shipment.volumeM3))}
            {row("Pieces", int(shipment.pieces))}
            {row("Floor space", shipment.floorAreaM2 == null ? "Estimated" : `${shipment.floorAreaM2} m²`)}
            {row("Heaviest piece", shipment.heaviestPieceKg == null ? "Not given" : kg(shipment.heaviestPieceKg))}
            {row("Dangerous goods", shipment.isDangerousGoods ? "Yes" : "No")}
            {row("Cargo", shipment.cargoType)}
          </>
        )}
        {row("Ready", formatDay(new Date(shipment.readyDate)))}
        {row("Deliver by", formatDay(new Date(shipment.deliverBy)))}
      </dl>
      <p className="mt-2 text-xs text-muted">{shipment.commodity}</p>
      <Link href={`/shipper/new?edit=${shipment.id}`} className="btn-secondary mt-3 w-full">
        Edit
      </Link>
    </aside>
  );
}
