import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { daysBetween } from "@/lib/dates";
import { buildOffers } from "@/lib/offers";
import { chargeableWeight, visibleListingsWhere } from "@/lib/rules";
import { requireRole } from "@/lib/session";
import { CompareView, ShipmentRail } from "@/components/CompareView";
import { MODE_ORDER, type Mode } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function Compare({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ mode?: string }> }) {
  const session = await requireRole("SHIPPER");
  const { id } = await params;
  const { mode } = await searchParams;

  const shipment = await prisma.shipmentRequest.findUnique({ where: { id } });
  if (!shipment || shipment.shipperCompanyId !== session.companyId) notFound();

  // Verified carriers only. The condition lives in visibleListingsWhere and is covered by a unit test.
  const listings = await prisma.capacityListing.findMany({
    where: visibleListingsWhere(shipment),
    include: { carrier: { select: { id: true, name: true, verified: true } } },
  });
  const offers = buildOffers(shipment, listings);

  const breakdown = Object.fromEntries(
    MODE_ORDER.map((m) => [
      m,
      chargeableWeight({ mode: m, weightKg: shipment.weightKg, volumeM3: shipment.volumeM3 }),
    ]),
  ) as Record<Mode, { actualKg: number; volumetricKg: number; chargedKg: number }>;

  const summary = {
    id: shipment.id,
    origin: shipment.origin,
    destination: shipment.destination,
    cargoKind: shipment.cargoKind,
    vehicleCount: shipment.vehicleCount,
    floorAreaM2: shipment.floorAreaM2,
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
        initialMode={(MODE_ORDER as readonly string[]).includes(mode ?? "") ? (mode as Mode) : null}
      /></div>
    </div>
  );
}
