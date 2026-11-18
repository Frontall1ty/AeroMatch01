import { describe, expect, it } from "vitest";
import { CITIES, destinationsFrom, distanceKm, modesBetween } from "./constants";
import { labelOffers, recommend, recommendationReason } from "./decision";
import { listingSchema, shipmentSchema } from "./validation";

describe("which modes exist between two cities", () => {
  it("air runs between any two different cities", () => {
    for (const a of CITIES) for (const b of CITIES) {
      if (a.code !== b.code) expect(modesBetween(a.code, b.code)).toContain("AIR");
    }
  });
  it("sea only runs between two coastal cities", () => {
    for (const a of CITIES) for (const b of CITIES) {
      if (a.code === b.code) continue;
      expect(modesBetween(a.code, b.code).includes("SEA")).toBe(a.coastal && b.coastal);
    }
  });
  it("an inland city never gets sea, in either direction", () => {
    expect(modesBetween("TAS", "IST")).not.toContain("SEA");
    expect(modesBetween("IST", "TAS")).not.toContain("SEA");
    expect(modesBetween("ALA", "DXB")).not.toContain("SEA");
  });
  it("coastal pairs get sea", () => {
    expect(modesBetween("IST", "DXB")).toEqual(["AIR", "SEA", "ROAD"]);
    expect(modesBetween("DXB", "JFK")).toEqual(["AIR", "SEA"]); // different landmasses: no road, no rail
  });
  it("is the same in both directions and empty for the same city", () => {
    for (const a of CITIES) for (const b of CITIES) {
      if (a.code !== b.code) expect([...modesBetween(a.code, b.code)].sort()).toEqual([...modesBetween(b.code, a.code)].sort());
    }
    expect(modesBetween("TAS", "TAS")).toEqual([]);
  });
  it("Tashkent keeps its pilot lanes: air, rail and road to Istanbul, air and road to Dubai", () => {
    expect(modesBetween("TAS", "IST")).toEqual(["AIR", "RAIL", "ROAD"]);
    expect(modesBetween("TAS", "DXB")).toEqual(["AIR", "ROAD"]);
  });
  it("lists destinations, never the origin itself", () => {
    expect(destinationsFrom("TAS").map((c) => c.code)).not.toContain("TAS");
    expect(destinationsFrom("TAS").length).toBe(CITIES.length - 1);
  });
  it("knows a distance for every pair", () => {
    for (const a of CITIES) for (const b of CITIES) {
      if (a.code !== b.code) expect(distanceKm(a.code, b.code)).toBe(distanceKm(b.code, a.code));
    }
  });
});

describe("seeded demo listings", () => {
  it("none depart before the demo ready date", async () => {
    const { LISTING_PREVIEW } = await import("./seed");
    const early = LISTING_PREVIEW().filter((l) => l.dep < 0);
    expect(early.map((l) => l.id)).toEqual([]);
  });
  it("every listing is on a lane where its mode runs", async () => {
    const { LISTING_PREVIEW } = await import("./seed");
    for (const l of LISTING_PREVIEW()) {
      expect(modesBetween(l.origin ?? "TAS", l.destination), l.id).toContain(l.mode);
    }
  });
});

describe("validation uses the lanes", () => {
  const shipment = {
    origin: "IST", destination: "DXB", cargoKind: "GENERAL", weightKg: 1000, volumeM3: 5, pieces: 4, floorAreaM2: null,
    pieceLengthCm: null, pieceWidthCm: null, pieceHeightCm: null, pieceWeightKg: null, stackable: false, vehicleCount: null,
    heaviestPieceKg: null, isDangerousGoods: false, cargoType: "General cargo", commodity: "", readyDate: "2099-01-01", deliverBy: "2099-02-01", notes: "",
  };
  it("accepts a shipment between two cities", () => {
    expect(shipmentSchema.safeParse(shipment).success).toBe(true);
  });
  it("refuses the same city on both ends", () => {
    expect(shipmentSchema.safeParse({ ...shipment, destination: "IST" }).success).toBe(false);
  });
  it("refuses an unknown city", () => {
    expect(shipmentSchema.safeParse({ ...shipment, origin: "XXX" }).success).toBe(false);
  });

  const listing = {
    mode: "SEA", origin: "IST", destination: "DXB", cargoKind: "GENERAL", pricingUnit: "FLAT", departureDate: "2099-01-01", unitPrice: 3000,
    availableWeightKg: 20000, availableVolumeM3: 50, availableFloorM2: null, availableVehicles: null, transitDaysMin: 10, transitDaysMax: 14,
    equipment: "Container, 40 ft", cutoffHours: 48, maxPieceKg: 5000, acceptsDangerousGoods: false, minChargeableKg: 0, restrictions: "",
  };
  it("accepts a sea listing between two coastal cities", () => {
    expect(listingSchema.safeParse(listing).success).toBe(true);
  });
  it("refuses a sea listing from an inland city", () => {
    expect(listingSchema.safeParse({ ...listing, origin: "TAS", destination: "IST" }).success).toBe(false);
  });
  it("refuses a mode that does not run on the lane", () => {
    expect(listingSchema.safeParse({ ...listing, mode: "RAIL", origin: "DXB", destination: "PVG", pricingUnit: "PER_KG" }).success).toBe(false);
  });
});

describe("decision layer with safety", () => {
  // The demo shipment's five offers, with a demo safety score each.
  const offers = [
    { id: "air-fast", totalPrice: 17368, transitDaysMin: 1, transitDaysMax: 2, safetyScore: 5 },
    { id: "air-value", totalPrice: 14028, transitDaysMin: 2, transitDaysMax: 3, safetyScore: 5 },
    { id: "rail", totalPrice: 2442, transitDaysMin: 9, transitDaysMax: 12, safetyScore: 4 },
    { id: "road-full", totalPrice: 4800, transitDaysMin: 5, transitDaysMax: 7, safetyScore: 3 },
    { id: "road-groupage", totalPrice: 4440, transitDaysMin: 6, transitDaysMax: 8, safetyScore: 2 },
  ];
  it("recommends a different offer for each of the four priorities", () => {
    const pick = (p: "CHEAPEST" | "FASTEST" | "SAFEST" | "BALANCED") => recommend(offers, p).recommended?.id;
    expect(pick("FASTEST")).toBe("air-fast");
    expect(pick("CHEAPEST")).toBe("rail");
    expect(pick("BALANCED")).toBe("road-full");
    expect(pick("SAFEST")).toBe("air-value");
  });
  it("Safest picks the cheaper of two equally safe offers", () => {
    expect(recommend(offers, "SAFEST").recommended?.id).toBe("air-value");
  });
  it("ignores safety when every offer is equally safe", () => {
    const flat = offers.map(({ safetyScore: _s, ...o }) => o);
    const { recommended, scores } = recommend(flat, "SAFEST");
    expect(recommended).not.toBeNull();
    expect(scores.size).toBe(5);
    // with no safety difference the score is only price and time, so the cheapest-and-fast-enough offer wins
    expect(recommend(flat, "BALANCED").recommended?.id).toBe("road-full");
  });
  it("priority weights add up to 1", async () => {
    const { PRIORITY_WEIGHTS } = await import("./decision");
    for (const w of Object.values(PRIORITY_WEIGHTS)) expect(w.price + w.time + w.safety).toBeCloseTo(1, 10);
  });
  it("explains the Safest recommendation and says the score is a demo estimate", () => {
    const rec = offers[1];
    expect(recommendationReason(rec, offers, "SAFEST")).toBe(
      "Safest handling among options that meet your deadline (5 of 5, a demo estimate). Costs $11,586 more than the cheapest option.",
    );
  });
});

describe("Cheapest, Fastest and Safest labels", () => {
  const offers = [
    { id: "a", totalPrice: 900, transitDaysMin: 1, transitDaysMax: 2, safetyScore: 5 },
    { id: "b", totalPrice: 300, transitDaysMin: 8, transitDaysMax: 10, safetyScore: 3 },
    { id: "c", totalPrice: 500, transitDaysMin: 4, transitDaysMax: 6, safetyScore: 4 },
  ];
  it("puts each label on the right offer", () => {
    const l = labelOffers(offers);
    expect(l.get("a")).toEqual(["FASTEST", "SAFEST"]);
    expect(l.get("b")).toEqual(["CHEAPEST"]);
    expect(l.get("c")).toEqual([]);
  });
  it("gives a label to every offer that ties for it", () => {
    const l = labelOffers([...offers, { id: "d", totalPrice: 300, transitDaysMin: 9, transitDaysMax: 11, safetyScore: 3 }]);
    expect(l.get("b")).toContain("CHEAPEST");
    expect(l.get("d")).toContain("CHEAPEST");
  });
  it("gives no Safest label when all offers are equally safe", () => {
    const l = labelOffers(offers.map((o) => ({ ...o, safetyScore: 3 })));
    for (const labels of l.values()) expect(labels).not.toContain("SAFEST");
  });
  it("handles an empty list and a single offer", () => {
    expect(labelOffers([]).size).toBe(0);
    expect(labelOffers([offers[0]]).get("a")).toEqual(["CHEAPEST", "FASTEST"]);
  });
});
