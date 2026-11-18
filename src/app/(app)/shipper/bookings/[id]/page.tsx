import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDay } from "@/lib/dates";
import { kg, m3, money, moneyPrecise } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { AutoRefresh } from "@/components/AutoRefresh";
import { AwbData } from "@/components/AwbData";
import { Timeline } from "@/components/Timeline";
import { DemoBadge, ModeTag, PageTitle, StatusChip, VerifiedBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function BookingDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ requested?: string }>;
}) {
  const session = await requireRole("SHIPPER");
  const { id } = await params;
  const { requested } = await searchParams;

  const b = await prisma.booking.findUnique({
    where: { id },
    include: {
      listing: { include: { carrier: true } },
      shipment: { include: { shipper: true } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!b || b.shipment.shipperCompanyId !== session.companyId) notFound();

  const s = b.shipment;
  const l = b.listing;

  const awb =
    l.mode === "AIR"
      ? JSON.stringify(
          {
            note: "Illustrative structure. Not connected to any cargo system.",
            shipper: s.shipper.name,
            carrier: l.carrier.name,
            origin: s.origin,
            destination: s.destination,
            departureDate: l.departureDate.toISOString().slice(0, 10),
            pieces: s.pieces,
            grossWeightKg: s.weightKg,
            volumeM3: s.volumeM3,
            chargeableWeightKg: b.chargeableWeightKg,
            ratePerChargeableKg: l.pricePerChargeableKg,
            totalCharge: { amount: b.totalPrice, currency: l.currency },
            natureOfGoods: s.commodity,
            dangerousGoods: s.isDangerousGoods,
            handlingInformation: s.notes || null,
          },
          null,
          2,
        )
      : null;

  return (
    <div className="mx-auto max-w-4xl">
      <AutoRefresh />
      <PageTitle title="Booking">
        <Link href="/shipper/bookings" className="text-sm font-semibold underline underline-offset-2">All bookings</Link>
      </PageTitle>

      {requested && b.status === "REQUESTED" && (
        <p role="status" className="mb-4 rounded border border-good px-3 py-2 text-sm font-medium text-good">
          Request sent. The carrier will approve or reject it. This page updates by itself.
        </p>
      )}
      {b.status === "REJECTED" && (
        <p role="alert" className="mb-4 rounded border border-bad px-3 py-2 text-sm font-medium text-bad">
          The carrier rejected this request{b.rejectionReason ? `: ${b.rejectionReason}` : "."} Go back to the comparison and request another offer.
          <Link href={`/shipper/compare/${s.id}`} className="ml-2 underline">Back to comparison</Link>
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <section className="panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="condensed text-[28px] font-bold leading-none">TAS to {l.destination}</p>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                {l.carrier.name} {l.carrier.verified && <VerifiedBadge />} <ModeTag mode={l.mode} />
              </p>
            </div>
            <StatusChip status={b.status} />
          </div>
          <dl className="mt-4 grid grid-cols-[130px_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-muted">Equipment</dt><dd>{l.equipment}</dd>
            <dt className="text-muted">Departs</dt><dd>{formatDay(l.departureDate)}</dd>
            <dt className="text-muted">Transit</dt><dd>{l.transitDaysMin} to {l.transitDaysMax} days</dd>
            <dt className="text-muted">Cargo</dt><dd>{s.commodity}, {s.pieces} pieces, {kg(s.weightKg)}, {m3(s.volumeM3)}</dd>
            <dt className="text-muted">Charged weight</dt><dd>{kg(b.chargeableWeightKg)}</dd>
            <dt className="text-muted">Price</dt>
            <dd>
              <span className="text-xl font-bold">{money(b.totalPrice)}</span> <DemoBadge />
              <span className="block text-xs text-muted">{moneyPrecise(l.pricePerChargeableKg)} per kg</span>
            </dd>
          </dl>
        </section>

        <section className="panel p-4" aria-labelledby="timeline-title">
          <h2 id="timeline-title" className="mb-3 text-xl font-semibold">Milestones</h2>
          {b.status === "REQUESTED" ? (
            <p className="text-sm text-muted">Waiting for the carrier to approve. Milestones start once the booking is confirmed.</p>
          ) : b.status === "REJECTED" ? (
            <p className="text-sm text-muted">No milestones. This request was rejected.</p>
          ) : (
            <Timeline mode={l.mode} events={b.events} />
          )}
        </section>
      </div>

      {awb && b.status !== "REJECTED" && <div className="mt-6"><AwbData json={awb} /></div>}
    </div>
  );
}
