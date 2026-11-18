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
    weightKg: "",
    volumeM3: "",
    pieces: "",
    heaviestPieceKg: "",
    isDangerousGoods: false,
    cargoType: "Textiles and garments",
    commodity: "",
    readyDate: toInputDate(ready),
    deliverBy: toInputDate(addDays(ready, 9)),
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
        weightKg: String(s.weightKg),
        volumeM3: String(s.volumeM3),
        pieces: String(s.pieces),
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
