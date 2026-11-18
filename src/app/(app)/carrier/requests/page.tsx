import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDay } from "@/lib/dates";
import { kg, m3, money } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { RequestActions } from "@/components/RequestActions";
import { DemoBadge, EmptyState, ModeTag, PageTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Requests() {
  const session = await requireRole("CARRIER");
  const [requests, others] = await Promise.all([
    prisma.booking.findMany({
      where: { status: "REQUESTED", listing: { carrierCompanyId: session.companyId } },
      orderBy: { createdAt: "asc" },
      include: { listing: true, shipment: { include: { shipper: true } } },
    }),
    prisma.booking.count({ where: { status: "REQUESTED", listing: { carrierCompanyId: { not: session.companyId } } } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle title="Requests" />
      {others > 0 && (
        <p className="mb-4 rounded border border-rule bg-panel px-3 py-2 text-sm">
          {others} {others === 1 ? "request is" : "requests are"} waiting for other carriers. Use Acting as in the header to switch company.
        </p>
      )}
      {requests.length === 0 ? (
        <EmptyState title="No requests waiting">
          When a shipper uses Request booking on one of your listings, it appears here.
          <div className="mt-4"><Link href="/carrier/capacity/new" className="btn">Add capacity</Link></div>
        </EmptyState>
      ) : (
        <ul className="panel divide-y divide-rule">
          {requests.map((r) => {
            const fits = r.shipment.weightKg <= r.listing.availableWeightKg && r.shipment.volumeM3 <= r.listing.availableVolumeM3;
            return (
              <li key={r.id} className="grid gap-4 p-4 md:grid-cols-[1fr_auto]">
                <div className="text-sm">
                  <p className="text-base font-semibold">{r.shipment.shipper.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-muted">
                    <ModeTag mode={r.listing.mode} />
                    <span>TAS to {r.listing.destination}, departs {formatDay(r.listing.departureDate)}</span>
                  </p>
                  <dl className="mt-3 grid grid-cols-[120px_1fr] gap-x-3 gap-y-1">
                    <dt className="text-muted">Cargo</dt>
                    <dd>{r.shipment.commodity}, {r.shipment.pieces} pieces{r.shipment.isDangerousGoods ? ", dangerous goods" : ""}</dd>
                    <dt className="text-muted">Size</dt>
                    <dd>{kg(r.shipment.weightKg)}, {m3(r.shipment.volumeM3)}{r.shipment.heaviestPieceKg ? `, heaviest piece ${kg(r.shipment.heaviestPieceKg)}` : ""}</dd>
                    <dt className="text-muted">Charged weight</dt>
                    <dd>{kg(r.chargeableWeightKg)}</dd>
                    <dt className="text-muted">Price</dt>
                    <dd><span className="font-bold">{money(r.totalPrice)}</span> <DemoBadge /></dd>
                    <dt className="text-muted">Capacity left</dt>
                    <dd>{kg(r.listing.availableWeightKg)}, {m3(r.listing.availableVolumeM3)}{!fits && <span className="ml-2 font-semibold text-bad">Not enough for this request</span>}</dd>
                  </dl>
                </div>
                <div className="md:w-64"><RequestActions bookingId={r.id} /></div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
