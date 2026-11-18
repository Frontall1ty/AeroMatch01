import type { CargoKind, Mode, PricingUnit, PrismaClient } from "@prisma/client";
import { DEMO_EMAIL_SUFFIX } from "./accountSchemas";
import { CITIES, SAFETY_BY_MODE, distanceKm, modesBetween } from "./constants";
import { addDays, todayUtc } from "./dates";

type Seed = {
  id: string;
  carrier: string;
  mode: Mode;
  /** Defaults to Tashkent. */
  origin?: string;
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
  /** Handling safety 1 to 5 (demo estimate). Defaults from the mode and equipment. */
  safety?: number;
};

/**
 * Fictional carriers only. Every price, capacity and transit time is invented demo data.
 * Demo shipment: 25 crates of 160 x 100 x 100 cm, 240 kg each (6,000 kg, 40 m³, stackable 2 high,
 * about 22.2 m² of floor space), ready on day 0, deliver by day 14.
 */
export const COMPANIES = [
  { id: "demo-shipper", slug: "shipper", name: "Demo Textile Export LLC", type: "SHIPPER", verified: true, country: "Uzbekistan", city: "TAS" },
  { id: "demo-air-a", slug: "air-a", name: "Demo Air Cargo A", type: "CARRIER", verified: true, country: "Uzbekistan", city: "TAS" },
  { id: "demo-air-b", slug: "air-b", name: "Demo Air Cargo B", type: "GSA", verified: true, country: "Uzbekistan", city: "TAS" },
  { id: "demo-trucking", slug: "trucking", name: "Demo Trucking Co", type: "CARRIER", verified: true, country: "Uzbekistan", city: "TAS" },
  { id: "demo-rail", slug: "rail", name: "Demo Rail Freight", type: "CARRIER", verified: true, country: "Uzbekistan", city: "TAS" },
  { id: "demo-sea", slug: "sea", name: "Demo Sea Logistics", type: "CARRIER", verified: true, country: "Turkey", city: "IST" },
  { id: "demo-freight-road", slug: "freight-road", name: "Demo Freight Road", type: "FORWARDER", verified: false, country: "Uzbekistan", city: "TAS" },
] as const;

const LISTINGS: Seed[] = [
  // Tashkent to Istanbul: air, priced per chargeable kg
  { id: "ist-air-freighter-fast", carrier: "demo-air-a", mode: "AIR", destination: "IST", dep: 1, unit: "PER_KG", price: 2.6, weight: 30000, volume: 150, tMin: 1, tMax: 2, equipment: "Freighter", cutoff: 6, maxPiece: 3000, dg: true, minCh: 100, restrictions: "Pre-booked cargo only" },
  { id: "ist-air-freighter-value", carrier: "demo-air-a", mode: "AIR", destination: "IST", dep: 3, unit: "PER_KG", price: 2.1, weight: 22000, volume: 120, tMin: 2, tMax: 3, equipment: "Freighter", cutoff: 8, maxPiece: 3000, dg: false, minCh: 100, restrictions: "No dangerous goods" },
  { id: "ist-air-belly-wide", carrier: "demo-air-b", mode: "AIR", destination: "IST", dep: 0, unit: "PER_KG", price: 2.05, weight: 9000, volume: 45, tMin: 1, tMax: 1, equipment: "Belly, wide-body", cutoff: 4, maxPiece: 150, dg: false, minCh: 45, restrictions: "Max piece 150 kg, 1.6 m high" },
  { id: "ist-air-belly-narrow", carrier: "demo-air-b", mode: "AIR", destination: "IST", dep: 2, unit: "PER_KG", price: 2.3, weight: 4000, volume: 14, tMin: 1, tMax: 1, equipment: "Belly, narrow-body", cutoff: 4, maxPiece: 120, dg: false, minCh: 45, restrictions: "Small consignments only" },
  // Tashkent to Istanbul: road, three ways to price
  { id: "ist-road-full-truck", carrier: "demo-trucking", mode: "ROAD", destination: "IST", dep: 0, unit: "FLAT", price: 4800, weight: 22000, volume: 82, floor: 33, tMin: 5, tMax: 7, equipment: "Tent trailer, 82 m³", cutoff: 24, maxPiece: 2000, dg: true, minCh: 0, restrictions: "Whole truck, via Kazakhstan and Caspian ferry" },
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
  { id: "ala-road-full-truck", carrier: "demo-trucking", mode: "ROAD", destination: "ALA", dep: 0, unit: "FLAT", price: 1900, weight: 22000, volume: 82, floor: 33, tMin: 2, tMax: 3, equipment: "Tent trailer, 82 m³", cutoff: 12, maxPiece: 2000, dg: true, minCh: 0, restrictions: "Whole truck, border queue time varies" },
  { id: "ala-road-groupage", carrier: "demo-trucking", mode: "ROAD", destination: "ALA", dep: 2, unit: "PER_M2", price: 70, weight: 22000, volume: 82, floor: 33, tMin: 3, tMax: 4, equipment: "Groupage trailer", cutoff: 12, maxPiece: 2000, dg: false, minCh: 0, restrictions: "Shared trailer, priced per m²" },
  { id: "ala-rail", carrier: "demo-rail", mode: "RAIL", destination: "ALA", dep: 2, unit: "PER_M2", price: 45, weight: 40000, volume: 120, floor: 40, tMin: 3, tMax: 5, equipment: "Container platform, 40 m² floor", cutoff: 24, maxPiece: 5000, dg: false, minCh: 0, restrictions: "Priced per m² of wagon floor space" },
  { id: "ala-air-belly", carrier: "demo-air-b", mode: "AIR", destination: "ALA", dep: 1, unit: "PER_KG", price: 1.4, weight: 3000, volume: 18, tMin: 1, tMax: 1, equipment: "Belly, narrow-body", cutoff: 3, maxPiece: 120, dg: false, minCh: 45, restrictions: "Small consignments only" },
];

/* ---------- Generated lanes: every other pair of cities ---------- */

function hash(text: string): number {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h;
}
const r2 = (n: number) => Math.round(n * 100) / 100;
const r0 = (n: number) => Math.round(n);

/**
 * Plausible invented listings for every lane except the hand-written Tashkent ones.
 * Prices and transit times follow the distance, so longer lanes cost more and take longer.
 */
function generatedListings(): Seed[] {
  const out: Seed[] = [];
  const handWritten = new Set(["TAS-IST", "TAS-DXB", "TAS-ALA"]);
  for (const from of CITIES) {
    for (const to of CITIES) {
      if (from.code === to.code || handWritten.has(`${from.code}-${to.code}`)) continue;
      const km = distanceKm(from.code, to.code);
      const base = { origin: from.code, destination: to.code };
      for (const mode of modesBetween(from.code, to.code)) {
        const h = hash(`${from.code}${to.code}${mode}`);
        const id = (n: string) => `gen-${from.code}-${to.code}-${n}`.toLowerCase();
        if (mode === "AIR") {
          const long = km > 6000;
          out.push({ ...base, id: id("air-freighter"), carrier: "demo-air-a", mode, dep: 1 + (h % 3), unit: "PER_KG", price: r2(0.8 + km * 0.0004), weight: 30000, volume: 150, tMin: 1, tMax: long ? 3 : 2, equipment: "Freighter", cutoff: 6, maxPiece: 3000, dg: true, minCh: 100, restrictions: "Pre-booked cargo only" });
          out.push({ ...base, id: id("air-belly"), carrier: "demo-air-b", mode, dep: (h >>> 3) % 3, unit: "PER_KG", price: r2((0.8 + km * 0.0004) * 0.88), weight: 9000, volume: 45, tMin: 1, tMax: long ? 2 : 1, equipment: "Belly, wide-body", cutoff: 4, maxPiece: 150, dg: false, minCh: 45, restrictions: "Max piece 150 kg" });
        } else if (mode === "SEA") {
          const tMin = Math.ceil(km / 650);
          const tMax = Math.ceil(km / 450);
          out.push({ ...base, id: id("sea-fcl"), carrier: "demo-sea", mode, dep: 2 + (h % 4), unit: "FLAT", price: r0(km * 0.35 + 600), weight: 25000, volume: 60, tMin, tMax, equipment: "Container, 40 ft", cutoff: 72, maxPiece: 5000, dg: false, minCh: 0, restrictions: "Whole container" });
          out.push({ ...base, id: id("sea-lcl"), carrier: "demo-sea", mode, dep: 3 + ((h >>> 2) % 4), unit: "PER_KG", price: r2((0.03 + km * 0.000008) * 1.4), weight: 25000, volume: 60, tMin: tMin + 2, tMax: tMax + 3, equipment: "LCL consolidation", cutoff: 72, maxPiece: 5000, dg: false, minCh: 1000, restrictions: "Shared container" });
          out.push({ ...base, id: id("sea-cars"), carrier: "demo-sea", mode, dep: 2 + ((h >>> 4) % 4), cargo: "VEHICLES", unit: "PER_VEHICLE", price: r0(300 + km * 0.08), weight: 0, volume: 0, vehicles: 20, tMin, tMax: tMax + 1, equipment: "Ro-Ro vessel", cutoff: 72, maxPiece: 3000, dg: false, minCh: 0, restrictions: "Vehicles only" });
        } else if (mode === "RAIL") {
          const tMin = Math.ceil(km / 480);
          const tMax = Math.ceil(km / 330);
          out.push({ ...base, id: id("rail-platform"), carrier: "demo-rail", mode, dep: 1 + (h % 3), unit: "PER_M2", price: r0(20 + km * 0.012), weight: 40000, volume: 120, floor: 40, tMin, tMax, equipment: "Container platform, 40 m² floor", cutoff: 48, maxPiece: 5000, dg: false, minCh: 0, restrictions: "Priced per m² of wagon floor space" });
          out.push({ ...base, id: id("rail-wagon"), carrier: "demo-rail", mode, dep: 3 + ((h >>> 2) % 3), unit: "PER_KG", price: r2(0.05 + km * 0.00003), weight: 40000, volume: 120, tMin: tMin + 1, tMax: tMax + 2, equipment: "Covered wagon", cutoff: 48, maxPiece: 5000, dg: false, minCh: 1000, restrictions: "Wagon leaves when full" });
          out.push({ ...base, id: id("rail-cars"), carrier: "demo-rail", mode, dep: 1 + ((h >>> 4) % 3), cargo: "VEHICLES", unit: "PER_VEHICLE", price: r0(200 + km * 0.1), weight: 0, volume: 0, vehicles: 10, tMin: tMin + 1, tMax: tMax + 2, equipment: "Car-carrier wagon", cutoff: 48, maxPiece: 3000, dg: false, minCh: 0, restrictions: "Vehicles only" });
        } else {
          const tMin = Math.ceil(km / 750);
          const tMax = Math.ceil(km / 520);
          out.push({ ...base, id: id("road-full"), carrier: "demo-trucking", mode, dep: h % 2, unit: "FLAT", price: Math.max(700, r0(km * 1.25)), weight: 22000, volume: 82, floor: 33, tMin, tMax, equipment: "Tent trailer, 82 m³", cutoff: 24, maxPiece: 2000, dg: true, minCh: 0, restrictions: "Whole truck" });
          out.push({ ...base, id: id("road-groupage"), carrier: "demo-trucking", mode, dep: 1 + ((h >>> 2) % 2), unit: "PER_M2", price: r0(km * 0.045 + 10), weight: 22000, volume: 82, floor: 33, tMin: tMin + 1, tMax: tMax + 1, equipment: "Groupage trailer", cutoff: 24, maxPiece: 2000, dg: false, minCh: 0, restrictions: "Shared trailer, priced per m²" });
          out.push({ ...base, id: id("road-cars"), carrier: "demo-trucking", mode, dep: (h >>> 4) % 2, cargo: "VEHICLES", unit: "PER_VEHICLE", price: r0(200 + km * 0.17), weight: 0, volume: 0, vehicles: 8, tMin, tMax: tMax + 1, equipment: "Car carrier", cutoff: 24, maxPiece: 3000, dg: false, minCh: 0, restrictions: "Vehicles only" });
        }
      }
    }
  }
  return out;
}

/** Handling safety: from the mode, a shared trailer is rougher than a full truck. */
const safetyOf = (l: Seed) => l.safety ?? (l.equipment.includes("Groupage") ? 2 : SAFETY_BY_MODE[l.mode]);
/** Share of the original capacity that is already booked by others. Stable per listing, 10% to 45%. */
const bookedShare = (id: string) => 0.1 + (hash(id) % 36) / 100;
/** Round a capacity to a tidy number. */
const tidy = (n: number) => Math.round(n / 100) * 100;

/** All seeded listings, for tests. */
export const LISTING_PREVIEW = () => [...LISTINGS, ...generatedListings()];

export function demoReadyDate(): Date {
  const offset = Number(process.env.DEMO_READY_OFFSET_DAYS ?? 3);
  return addDays(todayUtc(), Number.isFinite(offset) ? offset : 3);
}

/** Wipes all data and loads the demo data. Dates are relative to today. */
export async function seedDemoData(prisma: PrismaClient): Promise<void> {
  const ready = demoReadyDate();

  // Only demo records are removed. Real accounts and their data are never touched.
  const demoBooking = {
    OR: [{ listing: { carrierCompanyId: { startsWith: "demo-" } } }, { shipment: { shipperCompanyId: { startsWith: "demo-" } } }],
  };
  await prisma.$transaction([
    prisma.booking.deleteMany({ where: demoBooking }), // milestone events go with them
    prisma.shipmentRequest.deleteMany({ where: { shipperCompanyId: { startsWith: "demo-" } } }),
    prisma.capacityListing.deleteMany({ where: { carrierCompanyId: { startsWith: "demo-" } } }),
    prisma.user.deleteMany({ where: { companyId: { startsWith: "demo-" } } }),
    prisma.company.deleteMany({ where: { id: { startsWith: "demo-" } } }),
    prisma.company.createMany({
      data: COMPANIES.map(({ slug: _slug, ...c }) => ({
        ...c,
        // The unverified demo carrier has an incomplete profile on purpose: it shows how verification works.
        phone: c.verified ? "+998 00 000 00 00" : null,
        address: c.verified ? "1 Example Street, Tashkent" : null,
        taxId: c.verified ? "000000000" : null,
        about: "Demo company with invented data.",
        verifiedAt: c.verified ? new Date() : null,
      })),
    }),
    prisma.user.createMany({
      data: COMPANIES.map((c) => ({
        id: `user-${c.id}`,
        name: "Demo user",
        email: `${c.slug}${DEMO_EMAIL_SUFFIX}`,
        role: c.type === "SHIPPER" ? ("SHIPPER" as const) : ("CARRIER" as const),
        companyId: c.id,
      })),
    }),
    prisma.capacityListing.createMany({
      data: [...LISTINGS, ...generatedListings()].map((l) => ({
        id: l.id,
        carrierCompanyId: l.carrier,
        mode: l.mode,
        origin: l.origin ?? "TAS",
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
        safetyScore: safetyOf(l),
        capacityWeightKg: l.cargo === "VEHICLES" ? null : tidy(l.weight / (1 - bookedShare(l.id))),
        capacityVehicles: l.cargo === "VEHICLES" ? r0((l.vehicles ?? 0) / (1 - bookedShare(l.id))) : null,
        status: "OPEN",
        isDemo: true,
      })),
    }),
  ]);
}
