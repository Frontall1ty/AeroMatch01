import { describe, expect, it } from "vitest";
import {
  chargeableWeight,
  evaluateAvailability,
  floorAreaOf,
  isVisibleToShipper,
  nextMilestone,
  priceFor,
  recommend,
  recommendationReason,
  statusAfterMilestones,
  totalPrice,
  vehicleEstimate,
  visibleListingsWhere,
  type ListingInput,
  type ShipmentInput,
} from "./rules";
import { parseDate } from "./dates";

const ready = parseDate("2026-11-24");
const shipment: ShipmentInput = {
  cargoKind: "GENERAL",
  weightKg: 6000,
  volumeM3: 40,
  heaviestPieceKg: 800,
  isDangerousGoods: false,
  readyDate: ready,
  deliverBy: parseDate("2026-12-08"),
};
const listing = (over: Partial<ListingInput> = {}): ListingInput => ({
  id: "l1",
  mode: "AIR",
  cargoKind: "GENERAL",
  pricingUnit: "PER_KG",
  unitPrice: 2,
  departureDate: parseDate("2026-11-25"),
  availableWeightKg: 30000,
  availableVolumeM3: 150,
  availableFloorM2: null,
  availableVehicles: null,
  transitDaysMin: 1,
  transitDaysMax: 2,
  maxPieceKg: 3000,
  acceptsDangerousGoods: true,
  minChargeableKg: 100,
  ...over,
});

describe("6.1 chargeable weight", () => {
  it("uses the larger of actual and volumetric weight (air 167)", () => {
    expect(chargeableWeight({ mode: "AIR", weightKg: 6000, volumeM3: 40 })).toEqual({
      actualKg: 6000,
      volumetricKg: 6680,
      chargedKg: 6680,
    });
  });
  it("uses actual weight when it is larger", () => {
    expect(chargeableWeight({ mode: "AIR", weightKg: 20000, volumeM3: 40 })).toEqual({
      actualKg: 20000,
      volumetricKg: 6680,
      chargedKg: 20000,
    });
  });
  it("uses mode factors road 333 and rail 500", () => {
    expect(chargeableWeight({ mode: "ROAD", weightKg: 6000, volumeM3: 40 }).chargedKg).toBe(13320);
    expect(chargeableWeight({ mode: "RAIL", weightKg: 6000, volumeM3: 40 }).chargedKg).toBe(20000);
  });
  it("raises to the listing minimum when higher", () => {
    expect(chargeableWeight({ mode: "AIR", weightKg: 20, volumeM3: 0.05, minChargeableKg: 100 }).chargedKg).toBe(100);
  });
  it("rounds up to whole kg", () => {
    expect(chargeableWeight({ mode: "AIR", weightKg: 10, volumeM3: 1.5 }).chargedKg).toBe(251);
  });
  it("computes a per-kg total", () => {
    expect(totalPrice(6680, 2.1)).toBe(14028);
  });
});

describe("pricing: the carrier picks the unit", () => {
  const general = { cargoKind: "GENERAL" as const, weightKg: 6000, volumeM3: 40 };

  it("per kg uses the chargeable weight", () => {
    const p = priceFor({ mode: "AIR", pricingUnit: "PER_KG", unitPrice: 2.1, minChargeableKg: 100, shipment: general });
    expect(p.total).toBe(14028);
    expect(p.basis).toBe("$2.10/kg × 6,680 kg");
  });
  it("per m² uses the floor space the shipper entered", () => {
    const p = priceFor({ mode: "ROAD", pricingUnit: "PER_M2", unitPrice: 200, shipment: { ...general, floorAreaM2: 18 } });
    expect(p.total).toBe(3600);
    expect(p.basis).toBe("$200/m² × 18 m²");
  });
  it("per m² estimates floor space from volume when it is not entered (2 m stack height)", () => {
    expect(floorAreaOf({ volumeM3: 40 })).toBe(20);
    const p = priceFor({ mode: "RAIL", pricingUnit: "PER_M2", unitPrice: 110, shipment: general });
    expect(p.total).toBe(2200);
  });
  it("flat price ignores the size of the shipment", () => {
    const p = priceFor({ mode: "ROAD", pricingUnit: "FLAT", unitPrice: 4800, shipment: general });
    expect(p.total).toBe(4800);
    expect(p.basis).toBe("Flat price, whole truck or wagon");
  });
  it("per vehicle multiplies by the number of vehicles", () => {
    const p = priceFor({
      mode: "ROAD",
      pricingUnit: "PER_VEHICLE",
      unitPrice: 900,
      shipment: { cargoKind: "VEHICLES", vehicleCount: 4, ...vehicleEstimate(4) },
    });
    expect(p.total).toBe(3600);
    expect(p.basis).toBe("$900/vehicle × 4");
  });
  it("estimates weight and volume for vehicles", () => {
    expect(vehicleEstimate(4)).toEqual({ weightKg: 6000, volumeM3: 48 });
  });
});

describe("6.2 availability", () => {
  it("is OK for a fitting listing", () => {
    expect(evaluateAvailability(shipment, listing())).toEqual({ status: "OK", reasons: [] });
  });
  it("flags insufficient weight with the remaining kg", () => {
    const r = evaluateAvailability(shipment, listing({ availableWeightKg: 4000 }));
    expect(r.status).toBe("INSUFFICIENT_CAPACITY");
    expect(r.reasons[0].text).toBe("Only 4,000 kg left");
  });
  it("flags insufficient volume", () => {
    const r = evaluateAvailability(shipment, listing({ availableVolumeM3: 30 }));
    expect(r.reasons[0].text).toBe("Only 30 m³ left");
  });
  it("lists weight and volume together", () => {
    const r = evaluateAvailability(shipment, listing({ availableWeightKg: 4000, availableVolumeM3: 14 }));
    expect(r.reasons[0].text).toBe("Only 4,000 kg and 14 m³ left");
  });
  it("flags too little floor space for carriers that sell by the m²", () => {
    const r = evaluateAvailability(shipment, listing({ pricingUnit: "PER_M2", availableFloorM2: 12 }));
    expect(r.status).toBe("INSUFFICIENT_CAPACITY");
    expect(r.reasons[0].text).toBe("Only 12 m² of floor space left");
  });
  it("uses the entered floor space instead of the estimate", () => {
    const fits = evaluateAvailability({ ...shipment, floorAreaM2: 10 }, listing({ availableFloorM2: 12 }));
    expect(fits.status).toBe("OK");
  });
  it("ignores floor space when the listing does not track it", () => {
    expect(evaluateAvailability(shipment, listing({ availableFloorM2: null })).status).toBe("OK");
  });
  it("flags a missed deadline with days late", () => {
    const r = evaluateAvailability(shipment, listing({ departureDate: parseDate("2026-11-30"), transitDaysMax: 10 }));
    expect(r.status).toBe("MISSES_DEADLINE");
    expect(r.reasons[0].text).toBe("Arrives 2 days after your deadline");
  });
  it("accepts arrival exactly on the deadline and uses the singular for one day", () => {
    expect(evaluateAvailability(shipment, listing({ departureDate: parseDate("2026-11-28"), transitDaysMax: 10 })).status).toBe("OK");
    const r = evaluateAvailability(shipment, listing({ departureDate: parseDate("2026-11-29"), transitDaysMax: 10 }));
    expect(r.reasons[0].text).toBe("Arrives 1 day after your deadline");
  });
  it("flags a piece that is too heavy and ignores the rule when no piece weight is given", () => {
    const r = evaluateAvailability(shipment, listing({ maxPieceKg: 150 }));
    expect(r.status).toBe("PIECE_TOO_HEAVY");
    expect(r.reasons[0].text).toBe("Max piece weight is 150 kg");
    expect(evaluateAvailability({ ...shipment, heaviestPieceKg: null }, listing({ maxPieceKg: 150 })).status).toBe("OK");
  });
  it("flags dangerous goods when the listing does not accept them", () => {
    const r = evaluateAvailability({ ...shipment, isDangerousGoods: true }, listing({ acceptsDangerousGoods: false }));
    expect(r.status).toBe("NO_DANGEROUS_GOODS");
  });
  it("reports every reason that applies", () => {
    const r = evaluateAvailability(shipment, listing({ maxPieceKg: 150, availableWeightKg: 100 }));
    expect(r.reasons.map((x) => x.code)).toEqual(["PIECE_TOO_HEAVY", "INSUFFICIENT_CAPACITY"]);
  });
});

describe("6.2 availability for vehicles", () => {
  const cars: ShipmentInput = { ...shipment, cargoKind: "VEHICLES", vehicleCount: 4, heaviestPieceKg: null, ...vehicleEstimate(4) };
  const carrier = (over: Partial<ListingInput> = {}) =>
    listing({ mode: "ROAD", cargoKind: "VEHICLES", pricingUnit: "PER_VEHICLE", unitPrice: 900, availableVehicles: 8, ...over });

  it("a vehicle carrier with enough slots is OK", () => {
    expect(evaluateAvailability(cars, carrier()).status).toBe("OK");
  });
  it("reports the vehicle slots left", () => {
    const r = evaluateAvailability(cars, carrier({ availableVehicles: 2 }));
    expect(r.reasons[0].text).toBe("Only 2 vehicle slots left");
    expect(evaluateAvailability(cars, carrier({ availableVehicles: 1 })).reasons[0].text).toBe("Only 1 vehicle slot left");
  });
  it("general cargo carriers do not take vehicles", () => {
    const r = evaluateAvailability(cars, listing());
    expect(r.status).toBe("CARGO_NOT_ACCEPTED");
    expect(r.reasons[0].text).toBe("Carries general cargo only");
  });
  it("vehicle carriers do not take general cargo", () => {
    const r = evaluateAvailability(shipment, carrier());
    expect(r.status).toBe("CARGO_NOT_ACCEPTED");
    expect(r.reasons[0].text).toBe("Carries vehicles only");
  });
});

describe("visibility: unverified carriers are never shown to shippers", () => {
  const base = { origin: "TAS", destination: "IST", status: "OPEN" as const, departureDate: parseDate("2026-11-25") };
  const request = { origin: "TAS", destination: "IST", readyDate: ready };
  it("shows verified OPEN listings on the lane", () => {
    expect(isVisibleToShipper({ ...base, carrierVerified: true }, request)).toBe(true);
  });
  it("hides listings of unverified carriers", () => {
    expect(isVisibleToShipper({ ...base, carrierVerified: false }, request)).toBe(false);
  });
  it("hides FULL and CLOSED listings, other lanes and listings departing before the ready date", () => {
    expect(isVisibleToShipper({ ...base, carrierVerified: true, status: "FULL" }, request)).toBe(false);
    expect(isVisibleToShipper({ ...base, carrierVerified: true, status: "CLOSED" }, request)).toBe(false);
    expect(isVisibleToShipper({ ...base, carrierVerified: true, destination: "DXB" }, request)).toBe(false);
    expect(isVisibleToShipper({ ...base, carrierVerified: true, departureDate: parseDate("2026-11-23") }, request)).toBe(false);
  });
  it("the database query always requires a verified carrier", () => {
    expect(visibleListingsWhere(request).carrier).toEqual({ verified: true });
    expect(visibleListingsWhere(request).status).toBe("OPEN");
  });
});

describe("6.3 decision layer", () => {
  const offers = [
    { id: "air-fast", totalPrice: 17368, transitDaysMin: 1, transitDaysMax: 2 },
    { id: "air-value", totalPrice: 14028, transitDaysMin: 2, transitDaysMax: 3 },
    { id: "road-full", totalPrice: 4800, transitDaysMin: 5, transitDaysMax: 7 },
    { id: "road-groupage", totalPrice: 4000, transitDaysMin: 6, transitDaysMax: 8 },
    { id: "rail", totalPrice: 2200, transitDaysMin: 9, transitDaysMax: 12 },
  ];
  it("recommends a different mode for each priority", () => {
    expect(recommend(offers, "FASTEST").recommended?.id).toBe("air-fast");
    expect(recommend(offers, "BALANCED").recommended?.id).toBe("road-full");
    expect(recommend(offers, "CHEAPEST").recommended?.id).toBe("rail");
  });
  it("returns null with no offers and handles a single offer", () => {
    expect(recommend([], "BALANCED").recommended).toBeNull();
    expect(recommend([offers[0]], "BALANCED").recommended?.id).toBe("air-fast");
  });
  it("scores 0 when all values are equal", () => {
    const same = [
      { id: "a", totalPrice: 100, transitDaysMin: 2, transitDaysMax: 4 },
      { id: "b", totalPrice: 100, transitDaysMin: 2, transitDaysMax: 4 },
    ];
    expect([...recommend(same, "BALANCED").scores.values()]).toEqual([0, 0]);
  });
  it("explains a pricier recommendation with the price per day saved", () => {
    // road-full vs cheapest rail: +2600, mid 6 vs 10.5 => 4.5 days => $578 per day
    expect(recommendationReason(offers[2], offers)).toBe(
      "Costs $2,600 more than the cheapest option and arrives about 5 days earlier ($578 per day saved).",
    );
  });
  it("explains the cheapest recommendation", () => {
    expect(recommendationReason(offers[4], offers)).toBe("Lowest price among options that meet your deadline.");
  });
  it("omits the per-day figure when the time difference is under half a day", () => {
    const close = [
      { id: "a", totalPrice: 1000, transitDaysMin: 4, transitDaysMax: 6 },
      { id: "c", totalPrice: 1300, transitDaysMin: 5, transitDaysMax: 5 },
    ];
    expect(recommendationReason(close[1], close)).toBe("Costs $300 more than the cheapest option with a similar transit time.");
  });
});

describe("6.4 milestones", () => {
  it("walks air milestones in order", () => {
    expect(nextMilestone("AIR", 1)?.label).toBe("Received from shipper");
    expect(nextMilestone("AIR", 2)?.label).toBe("Departed");
    expect(nextMilestone("AIR", 5)).toBeNull();
  });
  it("uses mode specific milestones", () => {
    expect(nextMilestone("ROAD", 2)?.label).toBe("Border crossed");
    expect(nextMilestone("RAIL", 1)?.label).toBe("Loaded on wagon");
    expect(nextMilestone("RAIL", 3)?.label).toBe("Arrived at terminal");
  });
  it("sets status: CONFIRMED after the first, IN_PROGRESS after the second, DELIVERED at the last", () => {
    expect(statusAfterMilestones("AIR", 1)).toBe("CONFIRMED");
    expect(statusAfterMilestones("AIR", 2)).toBe("IN_PROGRESS");
    expect(statusAfterMilestones("RAIL", 4)).toBe("IN_PROGRESS");
    expect(statusAfterMilestones("RAIL", 5)).toBe("DELIVERED");
  });
});
