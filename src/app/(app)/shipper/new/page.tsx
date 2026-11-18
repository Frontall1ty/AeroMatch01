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
    sizeMode: "PIECES",
    pieces: "",
    pieceWeightKg: "",
    pieceLengthCm: "",
    pieceWidthCm: "",
    pieceHeightCm: "",
    stackable: false,
    weightKg: "",
    volumeM3: "",
    floorAreaM2: "",
    heaviestPieceKg: "",
    vehicleCount: "",
    isDangerousGoods: false,
    cargoType: "Textiles and garments",
    commodity: "",
    readyDate: toInputDate(ready),
    deliverBy: toInputDate(addDays(ready, 14)),
    notes: "",
  };
  // 25 crates of 160 x 100 x 100 cm, 240 kg each: 6,000 kg and 40 m³.
  const demo: ShipmentDefaults = {
    ...blank,
    pieces: "25",
    pieceWeightKg: "240",
    pieceLengthCm: "160",
    pieceWidthCm: "100",
    pieceHeightCm: "100",
    stackable: true,
    commodity: "Cotton knit garments in crates",
  };

  let defaults = blank;
  if (edit) {
    const s = await prisma.shipmentRequest.findUnique({ where: { id: edit } });
    if (s && s.shipperCompanyId === session.companyId) {
      const vehicles = s.cargoKind === "VEHICLES";
      const hasPiece = s.pieceLengthCm != null && s.pieceWidthCm != null && s.pieceHeightCm != null && s.pieceWeightKg != null;
      defaults = {
        destination: s.destination,
        cargoKind: s.cargoKind,
        sizeMode: hasPiece ? "PIECES" : "TOTALS",
        pieces: vehicles ? "" : String(s.pieces),
        pieceWeightKg: s.pieceWeightKg == null ? "" : String(s.pieceWeightKg),
        pieceLengthCm: s.pieceLengthCm == null ? "" : String(s.pieceLengthCm),
        pieceWidthCm: s.pieceWidthCm == null ? "" : String(s.pieceWidthCm),
        pieceHeightCm: s.pieceHeightCm == null ? "" : String(s.pieceHeightCm),
        stackable: s.stackable,
        weightKg: vehicles ? "" : String(s.weightKg),
        volumeM3: vehicles ? "" : String(s.volumeM3),
        floorAreaM2: hasPiece || s.floorAreaM2 == null ? "" : String(s.floorAreaM2),
        heaviestPieceKg: hasPiece || s.heaviestPieceKg == null ? "" : String(s.heaviestPieceKg),
        vehicleCount: s.vehicleCount == null ? "" : String(s.vehicleCount),
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
