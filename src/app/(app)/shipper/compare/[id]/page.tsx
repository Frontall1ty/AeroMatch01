import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { daysBetween } from "@/lib/dates";
import { buildOffers } from "@/lib/offers";
import { chargeableWeight, visibleListingsWhere } from "@/lib/rules";
import { requireRole } from "@/lib/session";
import { CompareView, ShipmentRail } from "@/components/CompareView";
import type { Mode } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function Compare({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("SHIPPER");
  const { id } = await params;

  const shipment = await prisma.shipmentRequest.findUnique({ where: { id } });
  if (!shipment || shipment.shipperCompanyId !== session.companyId) notFound();

  // Verified carriers only. The condition lives in visibleListingsWhere and is covered by a unit test.
  const listings = await prisma.capacityListing.findMany({
    where: visibleListingsWhere(shipment),
    include: { carrier: { select: { id: true, name: true, verified: true } } },
  });
  const offers = buildOffers(shipment, listings);

  const breakdown = Object.fromEntries(
    (["AIR", "ROAD", "SEA"] as Mode[]).map((m) => [
      m,
      chargeableWeight({ mode: m, weightKg: shipment.weightKg, volumeM3: shipment.volumeM3 }),
    ]),
  ) as Record<Mode, { actualKg: number; volumetricKg: number; chargedKg: number }>;

  const summary = {
    id: shipment.id,
    destination: shipment.destination,
    weightKg: shipment.weightKg,
    volumeM3: shipment.volumeM3,
    pieces: shipment.pieces,
    heaviestPieceKg: shipment.heaviestPieceKg,
    isDangerousGoods: shipment.isDangerousGoods,
    commodity: shipment.commodity,
    cargoType: shipment.cargoType,
    readyDate: shipment.readyDate.toISOString(),
    deliverBy: shipment.deliverBy.toISOString(),
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <div className="order-2 lg:order-1"><ShipmentRail shipment={summary} /></div>
      <div className="order-1 min-w-0 lg:order-2"><CompareView
        shipment={summary}
        offers={offers}
        breakdown={breakdown}
        deadlineDay={daysBetween(shipment.readyDate, shipment.deliverBy)}
      /></div>
    </div>
  );
}
