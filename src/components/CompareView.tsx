"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AIRPORT_CITY, MODE_LABEL, MODE_ORDER, VEHICLE_ESTIMATE, type Mode } from "@/lib/constants";
import { addDays, formatDay } from "@/lib/dates";
import { int, kg, m3, money } from "@/lib/format";
import type { OfferView } from "@/lib/offers";
import { recommend, recommendationReason, type Priority } from "@/lib/rules";
import { BookingDrawer, type ShipmentSummary } from "./BookingDrawer";
import { LaneChart } from "./LaneChart";
import { DemoBadge, EmptyState, ModeTag, VerifiedBadge } from "./ui";

type Breakdown = Record<Mode, { actualKg: number; volumetricKg: number; chargedKg: number }>;

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "CHEAPEST", label: "Cheapest" },
  { value: "FASTEST", label: "Fastest" },
  { value: "BALANCED", label: "Balanced" },
];

const arrivalText = (o: OfferView) =>
  o.arrivalMinDate === o.arrivalMaxDate
    ? formatDay(new Date(o.arrivalMinDate))
    : `${formatDay(new Date(o.arrivalMinDate))} to ${formatDay(new Date(o.arrivalMaxDate))}`;

const leftText = (o: OfferView) =>
  o.cargoKind === "VEHICLES"
    ? { main: `${o.availableVehicles ?? 0} vehicle slots`, sub: "" }
    : {
        main: kg(o.availableWeightKg),
        sub: `${m3(o.availableVolumeM3)}${o.availableFloorM2 != null ? `, ${o.availableFloorM2} m² floor` : ""}`,
      };

export function CompareView({
  shipment,
  offers,
  breakdown,
  deadlineDay,
}: {
  shipment: ShipmentSummary;
  offers: OfferView[];
  breakdown: Breakdown;
  deadlineDay: number;
}) {
  const [priority, setPriority] = useState<Priority>("BALANCED");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const ok = useMemo(() => offers.filter((o) => o.status === "OK"), [offers]);
  const notOk = useMemo(() => offers.filter((o) => o.status !== "OK"), [offers]);
  const { recommended } = useMemo(() => recommend(ok, priority), [ok, priority]);
  const reason = recommended ? recommendationReason(recommended, ok) : "";

  const sorted = useMemo(
    () =>
      [...ok].sort((a, b) =>
        a.id === recommended?.id ? -1 : b.id === recommended?.id ? 1 : a.totalPrice - b.totalPrice,
      ),
    [ok, recommended],
  );

  // Offers that only miss the deadline: how far would the deadline need to move?
  const nearMisses = notOk.filter((o) => o.reasons.every((r) => r.code === "MISSES_DEADLINE"));
  const minExtension = nearMisses.length ? Math.min(...nearMisses.map((o) => o.arrivalMaxDay - deadlineDay)) : 0;

  const bookingOffer = offers.find((o) => o.id === bookingId) ?? null;

  function select(id: string) {
    setActiveId(id);
    document.getElementById(`row-${id}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  const rowClass = (id: string) =>
    `border-b border-rule align-top ${activeId === id ? "bg-[#EEF2F7]" : ""}`;

  return (
    <div>
      {/* Route header: the bold element of the screen */}
      <div className="mb-5">
        <div className="flex items-center gap-4">
          <span className="condensed text-5xl font-bold leading-none md:text-[56px]">TAS</span>
          <span aria-hidden className="relative h-4 flex-1">
            <span className="route-line absolute left-0 right-1 top-1/2 h-0.5 -translate-y-1/2 bg-ink" />
            <span className="route-head absolute right-0 top-1/2 h-0 w-0 -translate-y-1/2 border-y-[7px] border-l-[12px] border-y-transparent border-l-ink" />
          </span>
          <span className="condensed text-5xl font-bold leading-none md:text-[56px]">{shipment.destination}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm text-muted">
          <span>{AIRPORT_CITY.TAS}</span>
          <span>{AIRPORT_CITY[shipment.destination]}</span>
        </div>
      </div>

      {/* Charged weight per mode and priority */}
      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="panel p-3">
          {shipment.cargoKind === "VEHICLES" ? (
            <>
              <p className="mb-2 text-sm font-semibold">Vehicles</p>
              <p className="text-sm">
                {shipment.vehicleCount} {shipment.vehicleCount === 1 ? "vehicle" : "vehicles"}. Only carriers that take vehicles are offered. They price per vehicle.
              </p>
              <p className="mt-2 text-xs text-muted">
                Weight and volume are estimated at {int(VEHICLE_ESTIMATE.weightKg)} kg and {VEHICLE_ESTIMATE.volumeM3} m³ per vehicle.
              </p>
            </>
          ) : (
            <>
              <p className="mb-2 text-sm font-semibold">Charged weight by mode</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {MODE_ORDER.map((m) => (
                  <div key={m} className="text-sm">
                    <ModeTag mode={m} />
                    <p className="text-muted">
                      Actual {int(breakdown[m].actualKg)} kg / Volumetric {int(breakdown[m].volumetricKg)} kg
                    </p>
                    <p className="font-semibold">Charged {int(breakdown[m].chargedKg)} kg</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                Each carrier sets its own pricing: per kg, per m² of floor space or a flat price. The price column shows how each offer is calculated.
              </p>
            </>
          )}
        </div>

        <div className="panel p-3">
          <p id="priority-label" className="mb-2 text-sm font-semibold">Priority</p>
          <div role="group" aria-labelledby="priority-label" className="flex overflow-hidden rounded border border-rule">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                aria-pressed={priority === p.value}
                onClick={() => setPriority(p.value)}
                className={`min-h-[44px] flex-1 px-4 text-sm font-semibold ${priority === p.value ? "bg-ink text-white" : "bg-panel hover:bg-paper"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {ok.length === 0 ? (
        <EmptyState title="No option meets your shipment and deadline">
          {nearMisses.length > 0
            ? `Move your deliver-by date later by ${minExtension} ${minExtension === 1 ? "day" : "days"} to see ${nearMisses.length} more ${nearMisses.length === 1 ? "option" : "options"}. `
            : "Try a different destination, a later deliver-by date or a smaller shipment. "}
          The reasons are listed below.
        </EmptyState>
      ) : (
        <>
          <LaneChart
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

          {/* Offers: desktop table */}
          <div className="panel mt-4 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-left text-sm">
              <caption className="sr-only">Offers that meet your shipment and deadline</caption>
              <thead className="border-b border-rule text-xs text-muted">
                <tr>
                  <th scope="col" className="min-w-[150px] p-3 font-semibold">Carrier</th>
                  <th scope="col" className="p-3 font-semibold">Mode</th>
                  <th scope="col" className="p-3 font-semibold">Departs</th>
                  <th scope="col" className="p-3 font-semibold">Arrives</th>
                  <th scope="col" className="p-3 font-semibold"><span className="mr-2">Price</span><DemoBadge /></th>
                  <th scope="col" className="p-3 font-semibold">Left</th>
                                    <th scope="col" className="p-3 font-semibold">Cutoff</th>
                  <th scope="col" className="p-3 font-semibold">Restrictions</th>
                  <th scope="col" className="p-3"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((o) => (
                  <tr
                    key={o.id}
                    id={`row-${o.id}`}
                    className={rowClass(o.id)}
                    onMouseEnter={() => setActiveId(o.id)}
                    onMouseLeave={() => setActiveId(null)}
                  >
                    <td className="p-3">
                      <p className="font-semibold">{o.carrierName}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {o.carrierVerified && <VerifiedBadge />}
                        {o.id === recommended?.id && (
                          <span className="rounded bg-ink px-1.5 py-0.5 text-xs font-semibold text-white">Recommended</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3"><ModeTag mode={o.mode} /><span className="block text-xs text-muted">{o.equipment}</span></td>
                    <td className="whitespace-nowrap p-3">{formatDay(new Date(o.departureDate))}</td>
                    <td className="whitespace-nowrap p-3">{arrivalText(o)}<span className="block text-xs text-muted">{o.transitDaysMin === o.transitDaysMax ? `${o.transitDaysMin} d` : `${o.transitDaysMin} to ${o.transitDaysMax} d`} transit</span></td>
                    <td className="p-3">
                      <p className="text-base font-bold">{money(o.totalPrice)}</p>
                      <p className="text-xs text-muted">{o.priceBasis}</p>
                    </td>
                    <td className="whitespace-nowrap p-3">{leftText(o).main}{leftText(o).sub && <span className="block text-xs text-muted">{leftText(o).sub}</span>}</td>
                    <td className="p-3">{o.cutoffHours} h</td>
                    <td className="p-3 text-muted">{o.restrictions || "None"}</td>
                    <td className="p-3">
                      <button className="btn whitespace-nowrap" onClick={() => setBookingId(o.id)}>Request booking</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Offers: mobile list */}
          <ul className="mt-4 divide-y divide-rule rounded border border-rule bg-panel md:hidden">
            {sorted.map((o) => (
              <li key={o.id} className="p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{o.carrierName}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <ModeTag mode={o.mode} />
                      {o.carrierVerified && <VerifiedBadge />}
                      {o.id === recommended?.id && (
                        <span className="rounded bg-ink px-1.5 py-0.5 text-xs font-semibold text-white">Recommended</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{money(o.totalPrice)}</p>
                    <DemoBadge />
                  </div>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <dt className="text-muted">Departs</dt><dd>{formatDay(new Date(o.departureDate))}</dd>
                  <dt className="text-muted">Arrives</dt><dd>{arrivalText(o)}</dd>
                  <dt className="text-muted">Price basis</dt><dd>{o.priceBasis}</dd>
                  <dt className="text-muted">Left</dt><dd>{leftText(o).main}{leftText(o).sub ? `, ${leftText(o).sub}` : ""}</dd>
                  <dt className="text-muted">Equipment</dt><dd>{o.equipment}</dd>
                  <dt className="text-muted">Cutoff</dt><dd>{o.cutoffHours} h before departure</dd>
                  <dt className="text-muted">Restrictions</dt><dd>{o.restrictions || "None"}</dd>
                </dl>
                <button className="btn mt-3 w-full" onClick={() => setBookingId(o.id)}>Request booking</button>
              </li>
            ))}
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
                <div>
                  <p className="font-semibold">
                    {o.carrierName} <span className="font-normal text-muted">· {o.equipment} · departs {formatDay(new Date(o.departureDate))}</span>
                  </p>
                  <div className="mt-1"><ModeTag mode={o.mode} /></div>
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
