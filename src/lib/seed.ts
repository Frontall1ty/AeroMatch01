import type { CargoKind, Mode, PricingUnit, PrismaClient } from "@prisma/client";
import { addDays, todayUtc } from "./dates";

type Seed = {
  id: string;
  carrier: string;
  mode: Mode;
  destination: string;
  /** Departure, in days after the demo ready date. */
  dep: number;
  cargo?: CargoKind;
  unit: PricingUnit;
  price: number;
  weight: number;
  volume: number;
  floor?: number;
  vehicles?: number;
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
 * Demo shipment: 6,000 kg, 40 m³, heaviest piece 800 kg, ready on day 0, deliver by day 14.
 * Floor space is estimated from volume: 40 m³ / 2 m = 20 m².
 */
export const COMPANIES = [
  { id: "demo-shipper", name: "Demo Textile Export LLC", type: "SHIPPER", verified: true, country: "Uzbekistan" },
  { id: "demo-air-a", name: "Demo Air Cargo A", type: "CARRIER", verified: true, country: "Uzbekistan" },
  { id: "demo-air-b", name: "Demo Air Cargo B", type: "GSA", verified: true, country: "Uzbekistan" },
  { id: "demo-trucking", name: "Demo Trucking Co", type: "CARRIER", verified: true, country: "Uzbekistan" },
  { id: "demo-rail", name: "Demo Rail Freight", type: "CARRIER", verified: true, country: "Uzbekistan" },
  { id: "demo-freight-road", name: "Demo Freight Road", type: "FORWARDER", verified: false, country: "Uzbekistan" },
] as const;

const LISTINGS: Seed[] = [
  // Tashkent to Istanbul: air, priced per chargeable kg
  { id: "ist-air-freighter-fast", carrier: "demo-air-a", mode: "AIR", destination: "IST", dep: 1, unit: "PER_KG", price: 2.6, weight: 30000, volume: 150, tMin: 1, tMax: 2, equipment: "Freighter", cutoff: 6, maxPiece: 3000, dg: true, minCh: 100, restrictions: "Pre-booked cargo only" },
  { id: "ist-air-freighter-value", carrier: "demo-air-a", mode: "AIR", destination: "IST", dep: 3, unit: "PER_KG", price: 2.1, weight: 22000, volume: 120, tMin: 2, tMax: 3, equipment: "Freighter", cutoff: 8, maxPiece: 3000, dg: false, minCh: 100, restrictions: "No dangerous goods" },
  { id: "ist-air-belly-wide", carrier: "demo-air-b", mode: "AIR", destination: "IST", dep: 0, unit: "PER_KG", price: 2.05, weight: 9000, volume: 45, tMin: 1, tMax: 1, equipment: "Belly, wide-body", cutoff: 4, maxPiece: 150, dg: false, minCh: 45, restrictions: "Max piece 150 kg, 1.6 m high" },
  { id: "ist-air-belly-narrow", carrier: "demo-air-b", mode: "AIR", destination: "IST", dep: 2, unit: "PER_KG", price: 2.3, weight: 4000, volume: 14, tMin: 1, tMax: 1, equipment: "Belly, narrow-body", cutoff: 4, maxPiece: 120, dg: false, minCh: 45, restrictions: "Small consignments only" },
  // Tashkent to Istanbul: road, three ways to price
  { id: "ist-road-full-truck", carrier: "demo-trucking", mode: "ROAD", destination: "IST", dep: 0, unit: "FLAT", price: 4800, weight: 22000, volume: 82, tMin: 5, tMax: 7, equipment: "Tent trailer, 82 m³", cutoff: 24, maxPiece: 2000, dg: true, minCh: 0, restrictions: "Whole truck, via Kazakhstan and Caspian ferry" },
  { id: "ist-road-groupage", carrier: "demo-trucking", mode: "ROAD", destination: "IST", dep: 1, unit: "PER_M2", price: 200, weight: 22000, volume: 82, floor: 33, tMin: 6, tMax: 8, equipment: "Groupage trailer", cutoff: 24, maxPiece: 2000, dg: false, minCh: 0, restrictions: "Shared trailer, priced per m² of floor space" },
  { id: "ist-road-late", carrier: "demo-trucking", mode: "ROAD", destination: "IST", dep: 5, unit: "PER_KG", price: 0.27, weight: 22000, volume: 82, tMin: 10, tMax: 12, equipment: "Tent trailer, 82 m³", cutoff: 24, maxPiece: 2000, dg: false, minCh: 1000, restrictions: "Departs when the trailer is full" },
  { id: "ist-road-cars", carrier: "demo-trucking", mode: "ROAD", destination: "IST", dep: 1, cargo: "VEHICLES", unit: "PER_VEHICLE", price: 900, weight: 0, volume: 0, vehicles: 8, tMin: 6, tMax: 8, equipment: "Car carrier", cutoff: 24, maxPiece: 3000, dg: false, minCh: 0, restrictions: "Vehicles only, up to 8 per trailer" },
  { id: "ist-road-unverified", carrier: "demo-freight-road", mode: "ROAD", destination: "IST", dep: 0, unit: "PER_KG", price: 0.22, weight: 22000, volume: 82, tMin: 5, tMax: 6, equipment: "Tent trailer, 82 m³", cutoff: 24, maxPiece: 2000, dg: true, minCh: 1000, restrictions: "Unverified carrier, never shown to shippers" },
  // Tashkent to Istanbul: rail
  { id: "ist-rail-platform", carrier: "demo-rail", mode: "RAIL", destination: "IST", dep: 2, unit: "PER_M2", price: 110, weight: 40000, volume: 120, floor: 40, tMin: 9, tMax: 12, equipment: "Container platform, 40 m² floor", cutoff: 48, maxPiece: 5000, dg: false, minCh: 0, restrictions: "Priced per m² of wagon floor space" },
  { id: "ist-rail-slow", carrier: "demo-rail", mode: "RAIL", destination: "IST", dep: 4, unit: "PER_KG", price: 0.15, weight: 40000, volume: 120, tMin: 9, tMax: 11, equipment: "Covered wagon", cutoff: 48, maxPiece: 5000, dg: false, minCh: 1000, restrictions: "Wagon leaves when full" },
  { id: "ist-rail-cars", carrier: "demo-rail", mode: "RAIL", destination: "IST", dep: 1, cargo: "VEHICLES", unit: "PER_VEHICLE", price: 700, weight: 0, volume: 0, vehicles: 10, tMin: 10, tMax: 13, equipment: "Car-carrier wagon", cutoff: 48, maxPiece: 3000, dg: false, minCh: 0, restrictions: "Vehicles only" },
  // Tashkent to Dubai (air and road only)
  { id: "dxb-air-freighter", carrier: "demo-air-a", mode: "AIR", destination: "DXB", dep: 2, unit: "PER_KG", price: 2.4, weight: 26000, volume: 130, tMin: 1, tMax: 2, equipment: "Freighter", cutoff: 6, maxPiece: 3000, dg: true, minCh: 100, restrictions: "Pre-booked cargo only" },
  { id: "dxb-air-belly", carrier: "demo-air-b", mode: "AIR", destination: "DXB", dep: 1, unit: "PER_KG", price: 2.0, weight: 7000, volume: 38, tMin: 1, tMax: 1, equipment: "Belly, wide-body", cutoff: 4, maxPiece: 200, dg: false, minCh: 45, restrictions: "Max piece 200 kg" },
  { id: "dxb-road", carrier: "demo-trucking", mode: "ROAD", destination: "DXB", dep: 1, unit: "PER_KG", price: 0.42, weight: 22000, volume: 82, tMin: 11, tMax: 15, equipment: "Tent trailer, 82 m³", cutoff: 24, maxPiece: 2000, dg: false, minCh: 1000, restrictions: "Via Turkmenistan and Iran" },
  // Tashkent to Almaty
  { id: "ala-road-full-truck", carrier: "demo-trucking", mode: "ROAD", destination: "ALA", dep: 0, unit: "FLAT", price: 1900, weight: 22000, volume: 82, tMin: 2, tMax: 3, equipment: "Tent trailer, 82 m³", cutoff: 12, maxPiece: 2000, dg: true, minCh: 0, restrictions: "Whole truck, border queue time varies" },
  { id: "ala-road-groupage", carrier: "demo-trucking", mode: "ROAD", destination: "ALA", dep: 2, unit: "PER_M2", price: 70, weight: 22000, volume: 82, floor: 33, tMin: 3, tMax: 4, equipment: "Groupage trailer", cutoff: 12, maxPiece: 2000, dg: false, minCh: 0, restrictions: "Shared trailer, priced per m²" },
  { id: "ala-rail", carrier: "demo-rail", mode: "RAIL", destination: "ALA", dep: 2, unit: "PER_M2", price: 45, weight: 40000, volume: 120, floor: 40, tMin: 3, tMax: 5, equipment: "Container platform, 40 m² floor", cutoff: 24, maxPiece: 5000, dg: false, minCh: 0, restrictions: "Priced per m² of wagon floor space" },
  { id: "ala-air-belly", carrier: "demo-air-b", mode: "AIR", destination: "ALA", dep: 1, unit: "PER_KG", price: 1.4, weight: 3000, volume: 18, tMin: 1, tMax: 1, equipment: "Belly, narrow-body", cutoff: 3, maxPiece: 120, dg: false, minCh: 45, restrictions: "Small consignments only" },
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
        cargoKind: l.cargo ?? "GENERAL",
        pricingUnit: l.unit,
        unitPrice: l.price,
        availableWeightKg: l.weight,
        availableVolumeM3: l.volume,
        availableFloorM2: l.floor ?? null,
        availableVehicles: l.vehicles ?? null,
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
