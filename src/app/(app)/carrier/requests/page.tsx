import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDay } from "@/lib/dates";
import { kg, m3, money } from "@/lib/format";
import { floorAreaOf, priceFor } from "@/lib/rules";
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
            const sh = r.shipment;
            const li = r.listing;
            const vehicles = sh.cargoKind === "VEHICLES";
            const fits = vehicles
              ? (sh.vehicleCount ?? 0) <= (li.availableVehicles ?? 0)
              : sh.weightKg <= li.availableWeightKg &&
                sh.volumeM3 <= li.availableVolumeM3 &&
                (li.availableFloorM2 == null || floorAreaOf(sh) <= li.availableFloorM2);
            const basis = priceFor({ mode: li.mode, pricingUnit: li.pricingUnit, unitPrice: li.unitPrice, minChargeableKg: li.minChargeableKg, shipment: sh }).basis;
            return (
              <li key={r.id} className="grid gap-4 p-4 md:grid-cols-[1fr_auto]">
                <div className="text-sm">
                  <p className="text-base font-semibold">{r.shipment.shipper.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-muted">
                    <ModeTag mode={r.listing.mode} />
                    <span>{r.listing.origin} to {r.listing.destination}, departs {formatDay(r.listing.departureDate)}</span>
                  </p>
                  <dl className="mt-3 grid grid-cols-[120px_1fr] gap-x-3 gap-y-1">
                    <dt className="text-muted">Cargo</dt>
                    <dd>{vehicles ? `${sh.commodity}, ${sh.vehicleCount} ${sh.vehicleCount === 1 ? "vehicle" : "vehicles"}` : `${sh.commodity}, ${sh.pieces} pieces${sh.isDangerousGoods ? ", dangerous goods" : ""}`}</dd>
                    {!vehicles && (
                      <>
                        <dt className="text-muted">Size</dt>
                        <dd>{kg(sh.weightKg)}, {m3(sh.volumeM3)}, floor space {sh.floorAreaM2 ?? floorAreaOf(sh)} m²{sh.heaviestPieceKg ? `, heaviest piece ${kg(sh.heaviestPieceKg)}` : ""}</dd>
                      </>
                    )}
                    <dt className="text-muted">Price</dt>
                    <dd><span className="font-bold">{money(r.totalPrice)}</span> <DemoBadge /><span className="block text-xs text-muted">{basis}</span></dd>
                    <dt className="text-muted">Capacity left</dt>
                    <dd>{vehicles ? `${li.availableVehicles ?? 0} vehicle slots` : `${kg(li.availableWeightKg)}, ${m3(li.availableVolumeM3)}${li.availableFloorM2 != null ? `, ${li.availableFloorM2} m² floor` : ""}`}{!fits && <span className="ml-2 font-semibold text-bad">Not enough for this request</span>}</dd>
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
