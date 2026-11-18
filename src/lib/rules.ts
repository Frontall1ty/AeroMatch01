import {
  MILESTONES,
  STACK_HEIGHT_M,
  VEHICLE_ESTIMATE,
  VOLUMETRIC_FACTOR,
  type CargoKind,
  type Mode,
  type PricingUnit,
} from "./constants";
import { addDays, daysBetween } from "./dates";

export * from "./decision";

const n0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const n1 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/* ---------- 6.1 Chargeable weight ---------- */

export type ChargeableBreakdown = { actualKg: number; volumetricKg: number; chargedKg: number };

/**
 * chargeable = max(actual, volume * factor[mode]), raised to the listing's minimum if higher.
 * Rounded up to whole kg.
 */
export function chargeableWeight(args: {
  mode: Mode;
  weightKg: number;
  volumeM3: number;
  minChargeableKg?: number;
}): ChargeableBreakdown {
  const actualKg = Math.ceil(args.weightKg);
  const volumetricKg = Math.ceil(args.volumeM3 * VOLUMETRIC_FACTOR[args.mode]);
  const chargedKg = Math.max(actualKg, volumetricKg, Math.ceil(args.minChargeableKg ?? 0));
  return { actualKg, volumetricKg, chargedKg };
}

export function totalPrice(chargedKg: number, pricePerChargeableKg: number): number {
  return Math.round(chargedKg * pricePerChargeableKg * 100) / 100;
}

/* ---------- Pricing: each carrier chooses its own unit ---------- */

export type PricingShipment = {
  cargoKind: CargoKind;
  weightKg: number;
  volumeM3: number;
  floorAreaM2?: number | null;
  vehicleCount?: number | null;
};

/** Floor space the shipment needs: entered by the shipper, otherwise estimated from volume. */
export function floorAreaOf(shipment: { volumeM3: number; floorAreaM2?: number | null }): number {
  if (shipment.floorAreaM2 != null && shipment.floorAreaM2 > 0) return shipment.floorAreaM2;
  return Math.round((shipment.volumeM3 / STACK_HEIGHT_M) * 100) / 100;
}

/** Weight and volume are never empty: vehicles use an estimate per vehicle. */
export function vehicleEstimate(count: number) {
  return { weightKg: count * VEHICLE_ESTIMATE.weightKg, volumeM3: count * VEHICLE_ESTIMATE.volumeM3 };
}

export type PriceResult = {
  total: number;
  /** What the unit price is multiplied by. */
  quantity: number;
  /** Chargeable weight: the price basis for per-kg pricing, information otherwise. */
  chargedKg: number;
  basis: string;
};

function money(n: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: Number.isInteger(n) || n >= 100 ? 0 : 2,
    maximumFractionDigits: n >= 100 ? 0 : 2,
  }).format(n);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function priceFor(args: {
  mode: Mode;
  pricingUnit: PricingUnit;
  unitPrice: number;
  minChargeableKg?: number;
  shipment: PricingShipment;
}): PriceResult {
  const { mode, pricingUnit, unitPrice, shipment } = args;
  const charge = chargeableWeight({
    mode,
    weightKg: shipment.weightKg,
    volumeM3: shipment.volumeM3,
    minChargeableKg: args.minChargeableKg,
  });
  const chargedKg = charge.chargedKg;

  if (pricingUnit === "PER_KG") {
    return { total: round2(chargedKg * unitPrice), quantity: chargedKg, chargedKg, basis: `$${money(unitPrice)}/kg × ${n0.format(chargedKg)} kg` };
  }
  if (pricingUnit === "PER_M2") {
    const floor = floorAreaOf(shipment);
    return { total: round2(floor * unitPrice), quantity: floor, chargedKg, basis: `$${money(unitPrice)}/m² × ${n1.format(floor)} m²` };
  }
  if (pricingUnit === "PER_VEHICLE") {
    const count = shipment.vehicleCount ?? 0;
    return { total: round2(count * unitPrice), quantity: count, chargedKg, basis: `$${money(unitPrice)}/vehicle × ${count}` };
  }
  return { total: round2(unitPrice), quantity: 1, chargedKg, basis: "Flat price, whole truck or wagon" };
}

/* ---------- 6.2 Availability ---------- */

export type ShipmentInput = {
  cargoKind: CargoKind;
  weightKg: number;
  volumeM3: number;
  floorAreaM2?: number | null;
  pieceLengthCm?: number | null;
  pieceWidthCm?: number | null;
  pieceHeightCm?: number | null;
  pieceWeightKg?: number | null;
  stackable?: boolean;
  vehicleCount?: number | null;
  heaviestPieceKg?: number | null;
  isDangerousGoods: boolean;
  readyDate: Date;
  deliverBy: Date;
};

export type ListingInput = {
  id: string;
  mode: Mode;
  cargoKind: CargoKind;
  pricingUnit: PricingUnit;
  unitPrice: number;
  departureDate: Date;
  availableWeightKg: number;
  availableVolumeM3: number;
  availableFloorM2?: number | null;
  availableVehicles?: number | null;
  transitDaysMin: number;
  transitDaysMax: number;
  maxPieceKg: number;
  acceptsDangerousGoods: boolean;
  minChargeableKg: number;
};

export type AvailabilityCode =
  | "OK"
  | "INSUFFICIENT_CAPACITY"
  | "MISSES_DEADLINE"
  | "PIECE_TOO_HEAVY"
  | "NO_DANGEROUS_GOODS"
  | "CARGO_NOT_ACCEPTED";

export type Availability = {
  status: AvailabilityCode;
  /** Every reason that applies. Empty when OK. The first one decides `status`. */
  reasons: { code: Exclude<AvailabilityCode, "OK">; text: string }[];
};

function joinParts(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/**
 * Capacity is checked against what the shipment physically takes: actual weight, volume and,
 * where the carrier sells floor space, floor area. For vehicles it is the number of vehicle slots.
 * Chargeable weight is used for price only.
 */
export function evaluateAvailability(shipment: ShipmentInput, listing: ListingInput): Availability {
  const reasons: Availability["reasons"] = [];

  if (shipment.cargoKind !== listing.cargoKind) {
    reasons.push({
      code: "CARGO_NOT_ACCEPTED",
      text: listing.cargoKind === "VEHICLES" ? "Carries vehicles only" : "Carries general cargo only",
    });
    return { status: "CARGO_NOT_ACCEPTED", reasons };
  }

  if (shipment.cargoKind === "GENERAL") {
    if (shipment.isDangerousGoods && !listing.acceptsDangerousGoods) {
      reasons.push({ code: "NO_DANGEROUS_GOODS", text: "Does not accept dangerous goods" });
    }

    if (shipment.heaviestPieceKg != null && shipment.heaviestPieceKg > listing.maxPieceKg) {
      reasons.push({ code: "PIECE_TOO_HEAVY", text: `Max piece weight is ${n0.format(listing.maxPieceKg)} kg` });
    }

    const parts: string[] = [];
    if (shipment.weightKg > listing.availableWeightKg) parts.push(`${n0.format(Math.max(0, listing.availableWeightKg))} kg`);
    if (shipment.volumeM3 > listing.availableVolumeM3) parts.push(`${n1.format(Math.max(0, listing.availableVolumeM3))} m³`);
    if (listing.availableFloorM2 != null && floorAreaOf(shipment) > listing.availableFloorM2) {
      parts.push(`${n1.format(Math.max(0, listing.availableFloorM2))} m² of floor space`);
    }
    if (parts.length) reasons.push({ code: "INSUFFICIENT_CAPACITY", text: `Only ${joinParts(parts)} left` });
  } else {
    const need = shipment.vehicleCount ?? 0;
    const have = listing.availableVehicles ?? 0;
    if (need > have) {
      reasons.push({ code: "INSUFFICIENT_CAPACITY", text: `Only ${plural(Math.max(0, have), "vehicle slot")} left` });
    }
  }

  const arrivalLatest = addDays(listing.departureDate, listing.transitDaysMax);
  const daysLate = daysBetween(shipment.deliverBy, arrivalLatest);
  if (daysLate > 0) {
    reasons.push({ code: "MISSES_DEADLINE", text: `Arrives ${plural(daysLate, "day")} after your deadline` });
  }

  return { status: reasons[0]?.code ?? "OK", reasons };
}

/* ---------- Visibility: which listings a shipper may ever see ---------- */

export type VisibilityInput = {
  origin: string;
  destination: string;
  status: "OPEN" | "FULL" | "CLOSED";
  departureDate: Date;
  carrierVerified: boolean;
};

/** Same origin and destination, OPEN, carrier verified, departs on or after the ready date. */
export function isVisibleToShipper(
  listing: VisibilityInput,
  request: { origin: string; destination: string; readyDate: Date },
): boolean {
  return (
    listing.carrierVerified === true &&
    listing.status === "OPEN" &&
    listing.origin === request.origin &&
    listing.destination === request.destination &&
    listing.departureDate.getTime() >= request.readyDate.getTime()
  );
}

/** Prisma `where` that mirrors `isVisibleToShipper`. Never loosen the `verified` condition. */
export function visibleListingsWhere(request: { origin: string; destination: string; readyDate: Date }) {
  return {
    origin: request.origin,
    destination: request.destination,
    status: "OPEN" as const,
    departureDate: { gte: request.readyDate },
    carrier: { verified: true },
  };
}

/* ---------- 6.4 Milestones ---------- */

export type BookingStatusValue = "REQUESTED" | "CONFIRMED" | "REJECTED" | "IN_PROGRESS" | "DELIVERED";

/** The milestone a carrier can mark next, given how many have been recorded. Null when finished. */
export function nextMilestone(mode: Mode, recordedCount: number) {
  return MILESTONES[mode][recordedCount] ?? null;
}

/**
 * Status after `recordedCount` milestones are recorded.
 * First milestone is written on approval (CONFIRMED), IN_PROGRESS after the second, DELIVERED at the last.
 */
export function statusAfterMilestones(mode: Mode, recordedCount: number): BookingStatusValue {
  const total = MILESTONES[mode].length;
  if (recordedCount >= total) return "DELIVERED";
  if (recordedCount >= 2) return "IN_PROGRESS";
  return "CONFIRMED";
}
