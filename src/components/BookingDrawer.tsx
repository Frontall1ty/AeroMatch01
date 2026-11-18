"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { requestBooking } from "@/app/actions";
import { DOCUMENT_CHECKLIST, DOCUMENT_CHECKLIST_NOTE, MODE_LABEL, VEHICLE_DOCUMENTS, type CargoKind } from "@/lib/constants";
import { formatDay } from "@/lib/dates";
import { kg, m3, money } from "@/lib/format";
import type { OfferView } from "@/lib/offers";
import { DemoBadge, ModeTag, VerifiedBadge } from "./ui";

export type ShipmentSummary = {
  id: string;
  destination: string;
  cargoKind: CargoKind;
  vehicleCount: number | null;
  floorAreaM2: number | null;
  weightKg: number;
  volumeM3: number;
  pieces: number;
  heaviestPieceKg: number | null;
  isDangerousGoods: boolean;
  commodity: string;
  readyDate: string;
  deliverBy: string;
};

export function BookingDrawer({
  offer,
  shipment,
  onClose,
}: {
  offer: OfferView;
  shipment: ShipmentSummary;
  onClose: () => void;
}) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, []);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function confirm() {
    setError("");
    start(async () => {
      const result = await requestBooking({ shipmentId: shipment.id, listingId: offer.id });
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <div className="fixed inset-0 z-40" onKeyDown={onKeyDown}>
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto bg-panel shadow-drawer"
      >
        <div className="flex items-start justify-between gap-3 border-b border-rule p-4">
          <div>
            <h2 id="drawer-title" className="text-xl font-semibold">Request booking</h2>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              {offer.carrierName} {offer.carrierVerified && <VerifiedBadge />}
            </p>
          </div>
          <button ref={closeRef} type="button" className="btn-secondary !px-3" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="flex-1 space-y-5 p-4 text-sm">
          <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2">
            <dt className="text-muted">Route</dt>
            <dd className="font-semibold">TAS to {shipment.destination} · <ModeTag mode={offer.mode} /></dd>
            <dt className="text-muted">Equipment</dt>
            <dd>{offer.equipment}</dd>
            <dt className="text-muted">Departs</dt>
            <dd>{formatDay(new Date(offer.departureDate))}</dd>
            <dt className="text-muted">Arrives</dt>
            <dd>{formatDay(new Date(offer.arrivalMinDate))} to {formatDay(new Date(offer.arrivalMaxDate))}</dd>
            <dt className="text-muted">Cutoff</dt>
            <dd>{offer.cutoffHours} h before departure</dd>
            <dt className="text-muted">Cargo</dt>
            <dd>
              {shipment.cargoKind === "VEHICLES"
                ? `${shipment.commodity}, ${shipment.vehicleCount} ${shipment.vehicleCount === 1 ? "vehicle" : "vehicles"}`
                : `${shipment.commodity}, ${shipment.pieces} ${shipment.pieces === 1 ? "piece" : "pieces"}, ${kg(shipment.weightKg)}, ${m3(shipment.volumeM3)}${shipment.isDangerousGoods ? ", dangerous goods" : ""}`}
            </dd>
            <dt className="text-muted">Price</dt>
            <dd>
              <span className="text-xl font-bold">{money(offer.totalPrice)}</span>{" "}
              <DemoBadge />
              <span className="mt-0.5 block text-xs text-muted">{offer.priceBasis}</span>
            </dd>
          </dl>

          <section aria-labelledby="docs-title">
            <h3 id="docs-title" className="mb-1 font-semibold">Documents for {MODE_LABEL[offer.mode].toLowerCase()} freight</h3>
            <ul className="list-disc space-y-0.5 pl-5">
              {[...DOCUMENT_CHECKLIST[offer.mode], ...(shipment.cargoKind === "VEHICLES" ? VEHICLE_DOCUMENTS : [])].map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">{DOCUMENT_CHECKLIST_NOTE}</p>
          </section>

          <p className="rounded border border-rule bg-paper px-3 py-2 text-xs text-muted">
            This sends a request to the carrier. Nothing is booked until the carrier approves. No payment is taken.
          </p>

          {error && (
            <p role="alert" className="rounded border border-bad px-3 py-2 font-medium text-bad">{error}</p>
          )}
        </div>

        <div className="flex gap-3 border-t border-rule p-4">
          <button type="button" className="btn flex-1" onClick={confirm} disabled={pending}>
            {pending ? "Sending..." : "Request booking"}
          </button>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={pending}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
