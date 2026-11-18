import { prisma } from "@/lib/db";
import { addDays, toInputDate, todayUtc } from "@/lib/dates";
import { getDemoReadyDate } from "@/lib/queries";
import { requireRole } from "@/lib/session";
import { ShipmentForm, type ShipmentDefaults } from "@/components/ShipmentForm";
import { PageTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewShipment({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const session = await requireRole("SHIPPER");
  const { edit } = await searchParams;

  const ready = await getDemoReadyDate();
  const blank: ShipmentDefaults = {
    destination: "IST",
    cargoKind: "GENERAL",
    weightKg: "",
    volumeM3: "",
    pieces: "",
    floorAreaM2: "",
    vehicleCount: "",
    heaviestPieceKg: "",
    isDangerousGoods: false,
    cargoType: "Textiles and garments",
    commodity: "",
    readyDate: toInputDate(ready),
    deliverBy: toInputDate(addDays(ready, 14)),
    notes: "",
  };
  const demo: ShipmentDefaults = {
    ...blank,
    weightKg: "6000",
    volumeM3: "40",
    pieces: "24",
    heaviestPieceKg: "800",
    commodity: "Cotton knit garments on pallets",
  };

  let defaults = blank;
  if (edit) {
    const s = await prisma.shipmentRequest.findUnique({ where: { id: edit } });
    if (s && s.shipperCompanyId === session.companyId) {
      defaults = {
        destination: s.destination,
        cargoKind: s.cargoKind,
        weightKg: s.cargoKind === "VEHICLES" ? "" : String(s.weightKg),
        volumeM3: s.cargoKind === "VEHICLES" ? "" : String(s.volumeM3),
        pieces: s.cargoKind === "VEHICLES" ? "" : String(s.pieces),
        floorAreaM2: s.floorAreaM2 == null ? "" : String(s.floorAreaM2),
        vehicleCount: s.vehicleCount == null ? "" : String(s.vehicleCount),
        heaviestPieceKg: s.heaviestPieceKg == null ? "" : String(s.heaviestPieceKg),
        isDangerousGoods: s.isDangerousGoods,
        cargoType: s.cargoType,
        commodity: s.commodity,
        readyDate: toInputDate(s.readyDate),
        deliverBy: toInputDate(s.deliverBy),
        notes: s.notes,
      };
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="New shipment" />
      <ShipmentForm defaults={defaults} demo={demo} today={toInputDate(todayUtc())} />
    </div>
  );
}
