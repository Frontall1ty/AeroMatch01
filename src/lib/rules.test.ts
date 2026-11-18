import { describe, expect, it } from "vitest";
import {
  chargeableWeight,
  evaluateAvailability,
  isVisibleToShipper,
  nextMilestone,
  recommend,
  recommendationReason,
  statusAfterMilestones,
  totalPrice,
  visibleListingsWhere,
  type ListingInput,
  type ShipmentInput,
} from "./rules";
import { parseDate } from "./dates";

const ready = parseDate("2026-11-24");
const shipment: ShipmentInput = {
  weightKg: 6000,
  volumeM3: 40,
  heaviestPieceKg: 800,
  isDangerousGoods: false,
  readyDate: ready,
  deliverBy: parseDate("2026-12-03"),
};
const listing = (over: Partial<ListingInput> = {}): ListingInput => ({
  id: "l1",
  mode: "AIR",
  departureDate: parseDate("2026-11-25"),
  availableWeightKg: 30000,
  availableVolumeM3: 150,
  pricePerChargeableKg: 2,
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
  it("uses mode factors road 333 and sea 1000", () => {
    expect(chargeableWeight({ mode: "ROAD", weightKg: 6000, volumeM3: 40 }).chargedKg).toBe(13320);
    expect(chargeableWeight({ mode: "SEA", weightKg: 6000, volumeM3: 40 }).chargedKg).toBe(40000);
  });
  it("raises to the listing minimum when higher", () => {
    expect(chargeableWeight({ mode: "AIR", weightKg: 20, volumeM3: 0.05, minChargeableKg: 100 }).chargedKg).toBe(100);
  });
  it("rounds up to whole kg", () => {
    expect(chargeableWeight({ mode: "AIR", weightKg: 10, volumeM3: 1.5 }).chargedKg).toBe(251);
  });
  it("computes total price", () => {
    expect(totalPrice(6680, 2.1)).toBe(14028);
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
    expect(r.status).toBe("INSUFFICIENT_CAPACITY");
    expect(r.reasons[0].text).toBe("Only 30 m³ left");
  });
  it("flags a missed deadline with days late", () => {
    const r = evaluateAvailability(shipment, listing({ departureDate: parseDate("2026-11-26"), transitDaysMax: 9 }));
    expect(r.status).toBe("MISSES_DEADLINE");
    expect(r.reasons[0].text).toBe("Arrives 2 days after your deadline");
  });
  it("accepts arrival exactly on the deadline", () => {
    const r = evaluateAvailability(shipment, listing({ departureDate: parseDate("2026-11-25"), transitDaysMax: 8 }));
    expect(r.status).toBe("OK");
  });
  it("uses the singular for one day late", () => {
    const r = evaluateAvailability(shipment, listing({ departureDate: parseDate("2026-11-25"), transitDaysMax: 9 }));
    expect(r.reasons[0].text).toBe("Arrives 1 day after your deadline");
  });
  it("flags a piece that is too heavy", () => {
    const r = evaluateAvailability(shipment, listing({ maxPieceKg: 150 }));
    expect(r.status).toBe("PIECE_TOO_HEAVY");
    expect(r.reasons[0].text).toBe("Max piece weight is 150 kg");
  });
  it("ignores the piece rule when the heaviest piece is not given", () => {
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
    { id: "airFast", totalPrice: 17368, transitDaysMin: 1, transitDaysMax: 2 },
    { id: "airMid", totalPrice: 14028, transitDaysMin: 2, transitDaysMax: 3 },
    { id: "road1", totalPrice: 4795, transitDaysMin: 5, transitDaysMax: 7 },
    { id: "road2", totalPrice: 3996, transitDaysMin: 6, transitDaysMax: 8 },
  ];
  it("recommends different offers per priority", () => {
    expect(recommend(offers, "FASTEST").recommended?.id).toBe("airFast");
    expect(recommend(offers, "CHEAPEST").recommended?.id).toBe("road2");
    expect(recommend(offers, "BALANCED").recommended?.id).toBe("road1");
  });
  it("returns null with no offers and handles a single offer", () => {
    expect(recommend([], "BALANCED").recommended).toBeNull();
    expect(recommend([offers[0]], "BALANCED").recommended?.id).toBe("airFast");
  });
  it("scores 0 when all values are equal", () => {
    const same = [
      { id: "a", totalPrice: 100, transitDaysMin: 2, transitDaysMax: 4 },
      { id: "b", totalPrice: 100, transitDaysMin: 2, transitDaysMax: 4 },
    ];
    const { scores } = recommend(same, "BALANCED");
    expect([...scores.values()]).toEqual([0, 0]);
  });
  it("explains a pricier recommendation with the price per day saved", () => {
    const rec = offers[2]; // road1: +799, mid 6 vs 7 -> 1 day
    expect(recommendationReason(rec, offers)).toBe(
      "Costs $799 more than the cheapest option and arrives about 1 day earlier ($799 per day saved).",
    );
  });
  it("explains the cheapest recommendation", () => {
    expect(recommendationReason(offers[3], offers)).toBe("Lowest price among options that meet your deadline.");
  });
  it("omits the per-day figure when the time difference is under half a day", () => {
    const close = [
      { id: "a", totalPrice: 1000, transitDaysMin: 4, transitDaysMax: 6 },
      { id: "b", totalPrice: 1200, transitDaysMin: 4, transitDaysMax: 5 }, // mid 4.5 vs 5 => 0.5 day
      { id: "c", totalPrice: 1300, transitDaysMin: 5, transitDaysMax: 5 }, // mid 5
    ];
    const text = recommendationReason({ id: "c", totalPrice: 1300, transitDaysMin: 5, transitDaysMax: 5 }, close);
    expect(text).toBe("Costs $300 more than the cheapest option with a similar transit time.");
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
    expect(nextMilestone("SEA", 1)?.label).toBe("Gate-in at port");
  });
  it("sets status: CONFIRMED after the first, IN_PROGRESS after the second, DELIVERED at the last", () => {
    expect(statusAfterMilestones("AIR", 1)).toBe("CONFIRMED");
    expect(statusAfterMilestones("AIR", 2)).toBe("IN_PROGRESS");
    expect(statusAfterMilestones("AIR", 4)).toBe("IN_PROGRESS");
    expect(statusAfterMilestones("AIR", 5)).toBe("DELIVERED");
  });
});
