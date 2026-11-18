export type Mode = "AIR" | "ROAD" | "SEA";

export const ORIGIN = "TAS";

export const DESTINATIONS = [
  { code: "IST", city: "Istanbul", country: "Turkey" },
  { code: "DXB", city: "Dubai", country: "United Arab Emirates" },
  { code: "ALA", city: "Almaty", country: "Kazakhstan" },
] as const;

export const AIRPORT_CITY: Record<string, string> = {
  TAS: "Tashkent",
  IST: "Istanbul",
  DXB: "Dubai",
  ALA: "Almaty",
};

/** Sea freight from Tashkent is only offered where a sea route exists (via a port). Almaty has none. */
export const MODES_BY_DESTINATION: Record<string, Mode[]> = {
  IST: ["AIR", "ROAD", "SEA"],
  DXB: ["AIR", "ROAD", "SEA"],
  ALA: ["AIR", "ROAD"],
};

export const MODE_LABEL: Record<Mode, string> = { AIR: "Air", ROAD: "Road", SEA: "Sea" };

/**
 * Volumetric factors, kg per m³.
 * Simplified. Verify against current industry practice before any real use.
 * AIR 167 = 6000 cm³ per kg (IATA convention). ROAD 333 = 3 m³ per tonne (common European road convention).
 * SEA 1000 = 1 m³ per tonne (weight/measurement rule). Real sea freight is usually priced per container or per W/M.
 */
export const VOLUMETRIC_FACTOR: Record<Mode, number> = {
  AIR: 167,
  ROAD: 333,
  SEA: 1000,
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
  SEA: [
    "Bill of lading",
    "Commercial invoice",
    "Packing list",
    "Export customs declaration",
    "Certificate of origin, if required",
    "Documents for the inland leg",
  ],
};

export const CARGO_TYPES = [
  "General cargo",
  "Textiles and garments",
  "Food and perishables",
  "Electronics",
  "Machinery and parts",
  "Chemicals",
  "Other",
] as const;

/** Sensible defaults when a carrier adds capacity, per mode. */
export const LISTING_DEFAULTS: Record<
  Mode,
  {
    equipment: string[];
    weightKg: number;
    volumeM3: number;
    pricePerKg: number;
    transitMin: number;
    transitMax: number;
    cutoffHours: number;
    maxPieceKg: number;
    minChargeableKg: number;
  }
> = {
  AIR: {
    equipment: ["Freighter", "Belly, wide-body", "Belly, narrow-body"],
    weightKg: 20000,
    volumeM3: 100,
    pricePerKg: 2.2,
    transitMin: 1,
    transitMax: 2,
    cutoffHours: 6,
    maxPieceKg: 1000,
    minChargeableKg: 100,
  },
  ROAD: {
    equipment: ["Tent trailer, 82 m³", "Reefer truck", "Container truck"],
    weightKg: 20000,
    volumeM3: 82,
    pricePerKg: 0.32,
    transitMin: 6,
    transitMax: 8,
    cutoffHours: 24,
    maxPieceKg: 2000,
    minChargeableKg: 1000,
  },
  SEA: {
    equipment: ["Container, 40 ft", "Container, 20 ft", "LCL consolidation"],
    weightKg: 25000,
    volumeM3: 60,
    pricePerKg: 0.06,
    transitMin: 24,
    transitMax: 32,
    cutoffHours: 72,
    maxPieceKg: 5000,
    minChargeableKg: 1000,
  },
};
