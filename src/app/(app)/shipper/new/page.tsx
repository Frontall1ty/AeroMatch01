import { prisma } from "@/lib/db";
import { MODE_ORDER, cityByCode, cityName, destinationsFrom, modesBetween, type Mode } from "@/lib/constants";
import { addDays, toInputDate, todayUtc } from "@/lib/dates";
import { getDemoReadyDate } from "@/lib/queries";
import { requireRole } from "@/lib/session";
import { type ShipmentDefaults } from "@/components/ShipmentForm";
import { ShipmentStudio } from "@/components/shipper/ShipmentStudio";
import type { ModeInfo } from "@/components/shipper/ModeChooser";

export const dynamic = "force-dynamic";

export default async function NewShipment({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const session = await requireRole("SHIPPER");
  const { edit } = await searchParams;

  const ready = await getDemoReadyDate();
  const home = session.city && cityByCode(session.city) ? session.city : "TAS";
  const blank: ShipmentDefaults = {
    origin: home,
    destination: (destinationsFrom(home).find((c) => c.code === "IST") ?? destinationsFrom(home)[0]).code,
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
        origin: s.origin,
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

  // What each way to ship looks like from the shipper's city: whether it exists at all, and how many departures are
  // open now. The count uses the same conditions as the comparison: open, not yet gone, verified carrier, not suspended.
  const reachable = new Set(destinationsFrom(home).flatMap((c) => modesBetween(home, c.code)));
  const counts = await prisma.capacityListing.groupBy({
    by: ["mode"],
    where: { origin: home, status: "OPEN", departureDate: { gte: ready }, carrier: { verified: true, suspendedAt: null } },
    _count: { _all: true },
  });
  const homeName = cityName(home);
  const REASON: Record<Mode, string> = {
    AIR: `No air lane from ${homeName}`,
    SEA: `${homeName} has no sea port`,
    RAIL: `No rail lane from ${homeName}`,
    ROAD: `No road lane from ${homeName}`,
  };
  const info = Object.fromEntries(
    MODE_ORDER.map((m) => [
      m,
      {
        available: reachable.has(m),
        reason: reachable.has(m) ? "" : REASON[m],
        departures: counts.find((c) => c.mode === m)?._count._all ?? 0,
      },
    ]),
  ) as Record<Mode, ModeInfo>;

  return (
    <ShipmentStudio
      key={edit ?? "new"}
      defaults={defaults}
      demo={demo}
      today={toInputDate(todayUtc())}
      info={info}
      home={homeName}
      chooser={!edit}
    />
  );
}
