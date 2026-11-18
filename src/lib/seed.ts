import type { Mode, PrismaClient } from "@prisma/client";
import { addDays, todayUtc } from "./dates";

type Seed = {
  id: string;
  carrier: string;
  mode: Mode;
  destination: string;
  /** Departure, in days after the demo ready date. */
  dep: number;
  weight: number;
  volume: number;
  price: number;
  tMin: number;
  tMax: number;
  equipment: string;
  cutoff: number;
  maxPiece: number;
  dg: boolean;
  minCh: number;
  restrictions: string;
};

/**
 * Fictional carriers only. Every price, capacity and transit time is invented demo data.
 * Demo shipment: 6,000 kg, 40 m³, heaviest piece 800 kg, ready on day 0, deliver by day 9.
 */
export const COMPANIES = [
  { id: "demo-shipper", name: "Demo Textile Export LLC", type: "SHIPPER", verified: true, country: "Uzbekistan" },
  { id: "demo-air-a", name: "Demo Air Cargo A", type: "CARRIER", verified: true, country: "Uzbekistan" },
  { id: "demo-air-b", name: "Demo Air Cargo B", type: "GSA", verified: true, country: "Uzbekistan" },
  { id: "demo-trucking", name: "Demo Trucking Co", type: "CARRIER", verified: true, country: "Uzbekistan" },
  { id: "demo-freight-road", name: "Demo Freight Road", type: "FORWARDER", verified: false, country: "Uzbekistan" },
  { id: "demo-sea", name: "Demo Sea Logistics", type: "CARRIER", verified: true, country: "Uzbekistan" },
] as const;

const LISTINGS: Seed[] = [
  // Tashkent to Istanbul
  { id: "ist-air-freighter-fast", carrier: "demo-air-a", mode: "AIR", destination: "IST", dep: 1, weight: 30000, volume: 150, price: 2.6, tMin: 1, tMax: 2, equipment: "Freighter", cutoff: 6, maxPiece: 3000, dg: true, minCh: 100, restrictions: "Pre-booked cargo only" },
  { id: "ist-air-freighter-value", carrier: "demo-air-a", mode: "AIR", destination: "IST", dep: 3, weight: 22000, volume: 120, price: 2.1, tMin: 2, tMax: 3, equipment: "Freighter", cutoff: 8, maxPiece: 3000, dg: false, minCh: 100, restrictions: "No dangerous goods" },
  { id: "ist-air-belly-wide", carrier: "demo-air-b", mode: "AIR", destination: "IST", dep: 0, weight: 9000, volume: 45, price: 2.05, tMin: 1, tMax: 1, equipment: "Belly, wide-body", cutoff: 4, maxPiece: 150, dg: false, minCh: 45, restrictions: "Max piece 150 kg, 1.6 m high" },
  { id: "ist-air-belly-narrow", carrier: "demo-air-b", mode: "AIR", destination: "IST", dep: 2, weight: 4000, volume: 14, price: 2.3, tMin: 1, tMax: 1, equipment: "Belly, narrow-body", cutoff: 4, maxPiece: 120, dg: false, minCh: 45, restrictions: "Small consignments only" },
  { id: "ist-road-express", carrier: "demo-trucking", mode: "ROAD", destination: "IST", dep: 0, weight: 22000, volume: 82, price: 0.36, tMin: 5, tMax: 7, equipment: "Tent trailer, 82 m³", cutoff: 24, maxPiece: 2000, dg: true, minCh: 1000, restrictions: "Via Kazakhstan and Caspian ferry" },
  { id: "ist-road-standard", carrier: "demo-trucking", mode: "ROAD", destination: "IST", dep: 1, weight: 22000, volume: 82, price: 0.3, tMin: 6, tMax: 8, equipment: "Tent trailer, 82 m³", cutoff: 24, maxPiece: 2000, dg: false, minCh: 1000, restrictions: "No dangerous goods" },
  { id: "ist-road-late", carrier: "demo-trucking", mode: "ROAD", destination: "IST", dep: 2, weight: 22000, volume: 82, price: 0.27, tMin: 7, tMax: 9, equipment: "Tent trailer, 82 m³", cutoff: 24, maxPiece: 2000, dg: false, minCh: 1000, restrictions: "Groupage trailer, longer transit" },
  { id: "ist-road-unverified", carrier: "demo-freight-road", mode: "ROAD", destination: "IST", dep: 0, weight: 22000, volume: 82, price: 0.22, tMin: 5, tMax: 6, equipment: "Tent trailer, 82 m³", cutoff: 24, maxPiece: 2000, dg: true, minCh: 1000, restrictions: "Unverified carrier, never shown to shippers" },
  { id: "ist-sea", carrier: "demo-sea", mode: "SEA", destination: "IST", dep: 4, weight: 25000, volume: 60, price: 0.06, tMin: 24, tMax: 32, equipment: "Container, 40 ft", cutoff: 72, maxPiece: 5000, dg: false, minCh: 1000, restrictions: "Via port, includes inland transfer" },
  // Tashkent to Dubai
  { id: "dxb-air-freighter", carrier: "demo-air-a", mode: "AIR", destination: "DXB", dep: 2, weight: 26000, volume: 130, price: 2.4, tMin: 1, tMax: 2, equipment: "Freighter", cutoff: 6, maxPiece: 3000, dg: true, minCh: 100, restrictions: "Pre-booked cargo only" },
  { id: "dxb-air-belly", carrier: "demo-air-b", mode: "AIR", destination: "DXB", dep: 1, weight: 7000, volume: 38, price: 2.0, tMin: 1, tMax: 1, equipment: "Belly, wide-body", cutoff: 4, maxPiece: 200, dg: false, minCh: 45, restrictions: "Max piece 200 kg" },
  { id: "dxb-road", carrier: "demo-trucking", mode: "ROAD", destination: "DXB", dep: 1, weight: 22000, volume: 82, price: 0.42, tMin: 11, tMax: 15, equipment: "Tent trailer, 82 m³", cutoff: 24, maxPiece: 2000, dg: false, minCh: 1000, restrictions: "Via Turkmenistan and Iran" },
  { id: "dxb-sea", carrier: "demo-sea", mode: "SEA", destination: "DXB", dep: 5, weight: 25000, volume: 60, price: 0.05, tMin: 21, tMax: 28, equipment: "Container, 40 ft", cutoff: 72, maxPiece: 5000, dg: false, minCh: 1000, restrictions: "Via port, includes inland transfer" },
  // Tashkent to Almaty (no sea route)
  { id: "ala-road-a", carrier: "demo-trucking", mode: "ROAD", destination: "ALA", dep: 0, weight: 22000, volume: 82, price: 0.12, tMin: 2, tMax: 3, equipment: "Tent trailer, 82 m³", cutoff: 12, maxPiece: 2000, dg: true, minCh: 1000, restrictions: "Border queue time varies" },
  { id: "ala-road-b", carrier: "demo-trucking", mode: "ROAD", destination: "ALA", dep: 2, weight: 22000, volume: 82, price: 0.11, tMin: 3, tMax: 4, equipment: "Reefer truck", cutoff: 12, maxPiece: 2000, dg: false, minCh: 1000, restrictions: "Temperature controlled" },
  { id: "ala-air-belly", carrier: "demo-air-b", mode: "AIR", destination: "ALA", dep: 1, weight: 3000, volume: 18, price: 1.4, tMin: 1, tMax: 1, equipment: "Belly, narrow-body", cutoff: 3, maxPiece: 120, dg: false, minCh: 45, restrictions: "Small consignments only" },
];

export function demoReadyDate(): Date {
  const offset = Number(process.env.DEMO_READY_OFFSET_DAYS ?? 3);
  return addDays(todayUtc(), Number.isFinite(offset) ? offset : 3);
}

/** Wipes all data and loads the demo data. Dates are relative to today. */
export async function seedDemoData(prisma: PrismaClient): Promise<void> {
  const ready = demoReadyDate();

  await prisma.$transaction([
    prisma.bookingEvent.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.shipmentRequest.deleteMany(),
    prisma.capacityListing.deleteMany(),
    prisma.user.deleteMany(),
    prisma.company.deleteMany(),
    prisma.company.createMany({ data: COMPANIES.map((c) => ({ ...c })) }),
    prisma.user.createMany({
      data: COMPANIES.map((c) => ({
        id: `user-${c.id}`,
        name: `${c.name} (demo user)`,
        role: c.type === "SHIPPER" ? "SHIPPER" : "CARRIER",
        companyId: c.id,
      })),
    }),
    prisma.capacityListing.createMany({
      data: LISTINGS.map((l) => ({
        id: l.id,
        carrierCompanyId: l.carrier,
        mode: l.mode,
        origin: "TAS",
        destination: l.destination,
        departureDate: addDays(ready, l.dep),
        availableWeightKg: l.weight,
        availableVolumeM3: l.volume,
        pricePerChargeableKg: l.price,
        currency: "USD",
        transitDaysMin: l.tMin,
        transitDaysMax: l.tMax,
        equipment: l.equipment,
        cutoffHours: l.cutoff,
        maxPieceKg: l.maxPiece,
        acceptsDangerousGoods: l.dg,
        minChargeableKg: l.minCh,
        restrictions: l.restrictions,
        status: "OPEN",
        isDemo: true,
      })),
    }),
  ]);
}
