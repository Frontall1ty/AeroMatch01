export type Mode = "AIR" | "ROAD" | "RAIL" | "SEA";
export type PricingUnit = "PER_KG" | "PER_M2" | "PER_VEHICLE" | "FLAT";
export type CargoKind = "GENERAL" | "VEHICLES";

/**
 * Cities and the modes that exist between them. A city decides where a shipment starts. Sea exists only
 * between two coastal cities, so an inland city like Tashkent never gets a sea option. Rail and road are listed
 * lane by lane. All lanes, distances and prices are invented demo data.
 */
export type City = { code: string; name: string; country: string; coastal: boolean };
export const CITIES: City[] = [
  { code: "TAS", name: "Tashkent", country: "Uzbekistan", coastal: false },
  { code: "ALA", name: "Almaty", country: "Kazakhstan", coastal: false },
  { code: "IST", name: "Istanbul", country: "Turkey", coastal: true },
  { code: "DXB", name: "Dubai", country: "United Arab Emirates", coastal: true },
  { code: "PVG", name: "Shanghai", country: "China", coastal: true },
  { code: "HAM", name: "Hamburg", country: "Germany", coastal: true },
];
export const cityByCode = (code: string | null | undefined) => CITIES.find((c) => c.code === code);
export const cityName = (code: string) => cityByCode(code)?.name ?? code;

const pair = (a: string, b: string) => [a, b].sort().join("-");
const ROAD_PAIRS = new Set(
  ["TAS-ALA", "TAS-IST", "TAS-DXB", "TAS-PVG", "TAS-HAM", "ALA-IST", "ALA-DXB", "ALA-PVG", "ALA-HAM", "IST-DXB", "IST-HAM"].map((p) => p.split("-") as [string, string]).map(([x, y]) => pair(x, y)),
);
const RAIL_PAIRS = new Set(
  ["TAS-ALA", "TAS-IST", "TAS-PVG", "TAS-HAM", "ALA-IST", "ALA-PVG", "ALA-HAM", "IST-PVG", "IST-HAM", "PVG-HAM"].map((p) => p.split("-") as [string, string]).map(([x, y]) => pair(x, y)),
);

/** Approximate route distance in km, for generating plausible demo prices and transit times. */
export const DISTANCE_KM: Record<string, number> = {
  "ALA-TAS": 800, "IST-TAS": 3400, "DXB-TAS": 2500, "PVG-TAS": 4300, "HAM-TAS": 4900,
  "ALA-IST": 3700, "ALA-DXB": 3000, "ALA-PVG": 3600, "ALA-HAM": 4700,
  "DXB-IST": 3000, "IST-PVG": 8300, "HAM-IST": 2000, "DXB-PVG": 6000, "DXB-HAM": 5300, "HAM-PVG": 8500,
};
export const distanceKm = (a: string, b: string) => DISTANCE_KM[pair(a, b)] ?? 4000;

/** Modes that exist between two cities. Empty when the cities are the same. */
export function modesBetween(origin: string, destination: string): Mode[] {
  const from = cityByCode(origin);
  const to = cityByCode(destination);
  if (!from || !to || origin === destination) return [];
  const key = pair(origin, destination);
  const modes: Mode[] = ["AIR"];
  if (from.coastal && to.coastal) modes.push("SEA");
  if (RAIL_PAIRS.has(key)) modes.push("RAIL");
  if (ROAD_PAIRS.has(key)) modes.push("ROAD");
  return modes;
}

/** Cities a shipment can go to from an origin. */
export const destinationsFrom = (origin: string) => CITIES.filter((c) => c.code !== origin && modesBetween(origin, c.code).length > 0);

/**
 * Handling safety, 1 to 5, as a demo estimate: how likely cargo is to be damaged, lost or delayed by handling.
 * It is invented, not measured. Real scores would come from claims and damage data.
 */
export const SAFETY_BY_MODE: Record<Mode, number> = { AIR: 5, RAIL: 4, SEA: 3, ROAD: 3 };
export const SAFETY_NOTE = "Handling safety is a demo estimate, not measured data.";

export const MODE_ORDER: Mode[] = ["AIR", "SEA", "RAIL", "ROAD"];
export const MODE_LABEL: Record<Mode, string> = { AIR: "Air", SEA: "Sea", RAIL: "Rail", ROAD: "Road" };

/**
 * Volumetric factors, kg per m³. Used for per-kg pricing.
 * Simplified. Verify against current industry practice before any real use.
 * AIR 167 = 6000 cm³ per kg (IATA convention). ROAD 333 = 3 m³ per tonne (common European road convention).
 * RAIL 500 is a placeholder for less-than-wagon rail cargo: confirm with a rail forwarder.
 * SEA 1000 = 1 m³ per tonne (weight or measurement rule). Sea freight is usually priced per container.
 */
export const VOLUMETRIC_FACTOR: Record<Mode, number> = {
  AIR: 167,
  ROAD: 333,
  RAIL: 500,
  SEA: 1000,
};

/**
 * Floor space is estimated from volume when the shipper does not enter it:
 * floor m² = volume m³ / STACK_HEIGHT_M. Verify with a road or rail forwarder.
 * (Road forwarders usually quote loading metres, LDM. This demo uses m² as entered by carriers.)
 */
export const STACK_HEIGHT_M = 2;

/** Estimates used when a shipment is vehicles, so that weight and volume are never empty. */
export const VEHICLE_ESTIMATE = { weightKg: 1500, volumeM3: 12 };

export const PRICING_UNIT_LABEL: Record<PricingUnit, string> = {
  PER_KG: "Per chargeable kg",
  PER_M2: "Per m² of floor space",
  FLAT: "Flat price for the whole truck or wagon",
  PER_VEHICLE: "Per vehicle",
};

export const CARGO_KIND_LABEL: Record<CargoKind, string> = {
  GENERAL: "General cargo",
  VEHICLES: "Vehicles",
};

export type Milestone = { label: string; code?: string };

/**
 * Milestones per mode, in order.
 * Air codes follow common air cargo status conventions (BKD, RCS, DEP, ARR, DLV).
 * Verify against current IATA Cargo-IMP / Cargo-XML status codes before any real use.
 */
export const MILESTONES: Record<Mode, Milestone[]> = {
  AIR: [
    { label: "Booked", code: "BKD" },
    { label: "Received from shipper", code: "RCS" },
    { label: "Departed", code: "DEP" },
    { label: "Arrived", code: "ARR" },
    { label: "Delivered", code: "DLV" },
  ],
  ROAD: [
    { label: "Booked" },
    { label: "Loaded" },
    { label: "Border crossed" },
    { label: "Arrived" },
    { label: "Delivered" },
  ],
  RAIL: [
    { label: "Booked" },
    { label: "Loaded on wagon" },
    { label: "Border crossed" },
    { label: "Arrived at terminal" },
    { label: "Delivered" },
  ],
  SEA: [
    { label: "Booked" },
    { label: "Gate-in at port" },
    { label: "Vessel departed" },
    { label: "Arrived at port" },
    { label: "Delivered" },
  ],
};

export const DOCUMENT_CHECKLIST_NOTE =
  "Indicative checklist. Requirements vary by cargo and destination; confirm with your forwarder or customs broker.";

export const DOCUMENT_CHECKLIST: Record<Mode, string[]> = {
  AIR: [
    "Commercial invoice",
    "Packing list",
    "Air waybill (AWB)",
    "Export customs declaration",
    "Certificate of origin, if required",
    "Dangerous goods declaration, if applicable",
  ],
  ROAD: [
    "CMR consignment note",
    "Commercial invoice",
    "Packing list",
    "Export customs declaration",
    "Transit documents, if applicable",
  ],
  RAIL: [
    "Rail consignment note (SMGS or CIM, depending on the route)",
    "Commercial invoice",
    "Packing list",
    "Export customs declaration",
    "Certificate of origin, if required",
    "Transit documents, if applicable",
  ],
  SEA: [
    "Bill of lading",
    "Commercial invoice",
    "Packing list",
    "Export customs declaration",
    "Certificate of origin, if required",
    "Documents for the inland leg, if any",
  ],
};

/** Extra documents when the cargo is vehicles. */
export const VEHICLE_DOCUMENTS = ["Vehicle list with VIN numbers", "Vehicle registration or export certificate"];

export const CARGO_TYPES = [
  "General cargo",
  "Textiles and garments",
  "Food and perishables",
  "Electronics",
  "Machinery and parts",
  "Chemicals",
  "Other",
] as const;

export const PRICING_UNITS_BY_MODE: Record<Mode, PricingUnit[]> = {
  AIR: ["PER_KG"],
  ROAD: ["PER_KG", "PER_M2", "FLAT", "PER_VEHICLE"],
  RAIL: ["PER_KG", "PER_M2", "FLAT", "PER_VEHICLE"],
  SEA: ["PER_KG", "FLAT", "PER_VEHICLE"],
};

/** Sensible defaults when a carrier adds capacity, per mode. All amounts are demo values. */
export const LISTING_DEFAULTS: Record<
  Mode,
  {
    equipment: string[];
    vehicleEquipment: string;
    weightKg: number;
    volumeM3: number;
    floorM2: number;
    vehicles: number;
    price: Record<PricingUnit, number>;
    transitMin: number;
    transitMax: number;
    cutoffHours: number;
    maxPieceKg: number;
    minChargeableKg: number;
  }
> = {
  AIR: {
    equipment: ["Freighter", "Belly, wide-body", "Belly, narrow-body"],
    vehicleEquipment: "Freighter",
    weightKg: 20000,
    volumeM3: 100,
    floorM2: 0,
    vehicles: 0,
    price: { PER_KG: 2.2, PER_M2: 0, FLAT: 0, PER_VEHICLE: 0 },
    transitMin: 1,
    transitMax: 2,
    cutoffHours: 6,
    maxPieceKg: 1000,
    minChargeableKg: 100,
  },
  ROAD: {
    equipment: ["Tent trailer, 82 m³", "Groupage trailer", "Reefer truck"],
    vehicleEquipment: "Car carrier",
    weightKg: 22000,
    volumeM3: 82,
    floorM2: 33,
    vehicles: 8,
    price: { PER_KG: 0.32, PER_M2: 190, FLAT: 4500, PER_VEHICLE: 900 },
    transitMin: 6,
    transitMax: 8,
    cutoffHours: 24,
    maxPieceKg: 2000,
    minChargeableKg: 1000,
  },
  RAIL: {
    equipment: ["Container platform, 40 m² floor", "Covered wagon", "Open wagon"],
    vehicleEquipment: "Car-carrier wagon",
    weightKg: 40000,
    volumeM3: 120,
    floorM2: 40,
    vehicles: 10,
    price: { PER_KG: 0.15, PER_M2: 110, FLAT: 3500, PER_VEHICLE: 700 },
    transitMin: 9,
    transitMax: 12,
    cutoffHours: 48,
    maxPieceKg: 5000,
    minChargeableKg: 1000,
  },
  SEA: {
    equipment: ["Container, 40 ft", "Container, 20 ft", "LCL consolidation"],
    vehicleEquipment: "Ro-Ro vessel",
    weightKg: 25000,
    volumeM3: 60,
    floorM2: 0,
    vehicles: 20,
    price: { PER_KG: 0.06, PER_M2: 0, FLAT: 3200, PER_VEHICLE: 450 },
    transitMin: 12,
    transitMax: 18,
    cutoffHours: 72,
    maxPieceKg: 5000,
    minChargeableKg: 1000,
  },
};
