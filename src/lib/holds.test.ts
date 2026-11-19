import { describe, expect, it } from "vitest";
import { fitGrid } from "./fit";
import { cargoLayout, HOLDS } from "./holds";

const crates = { cargoKind: "GENERAL" as const, pieces: 25, piece: { lengthCm: 160, widthCm: 100, heightCm: 100, weightKg: 240, stackable: true } };

describe("the hold picture on the new-shipment page", () => {
  it("places pieces with the same grid as the space calculator", () => {
    const l = cargoLayout("ROAD", crates);
    const fit = fitGrid(HOLDS.ROAD.box, crates.piece);
    expect(l.state).toBe("pieces");
    expect(l.perUnit).toBe(fit.count);
    expect(l.units).toBe(Math.ceil(25 / fit.count));
    expect(l.boxes.length).toBe(Math.min(25, fit.count));
  });
  it("never draws a box outside the hold", () => {
    for (const mode of ["AIR", "SEA", "RAIL", "ROAD"] as const) {
      const l = cargoLayout(mode, { ...crates, pieces: 400 });
      const { lengthCm, widthCm, heightCm } = HOLDS[mode].box;
      for (const b of l.boxes) {
        expect(b.x).toBeGreaterThanOrEqual(-1e-9);
        expect(b.x + b.l).toBeLessThanOrEqual(lengthCm / 100 + 1e-9);
        expect(b.y + b.w).toBeLessThanOrEqual(widthCm / 100 + 1e-9);
        expect(b.z + b.h).toBeLessThanOrEqual(heightCm / 100 + 1e-9);
      }
      expect(l.units).toBeGreaterThan(1);
    }
  });
  it("shows nothing until there is something to show", () => {
    expect(cargoLayout("AIR", { cargoKind: "GENERAL" }).state).toBe("empty");
    expect(cargoLayout("AIR", { cargoKind: "GENERAL", pieces: 3, piece: { lengthCm: 0, widthCm: 1, heightCm: 1, weightKg: 1, stackable: false } }).state).toBe("empty");
  });
  it("estimates pallets from the totals when there is no piece size", () => {
    const l = cargoLayout("RAIL", { cargoKind: "GENERAL", volumeM3: 40 });
    expect(l.state).toBe("estimate");
    expect(l.noun).toBe("pallets");
    expect(l.count).toBeGreaterThan(20);
  });
  it("draws cars for vehicles", () => {
    const l = cargoLayout("ROAD", { cargoKind: "VEHICLES", vehicleCount: 3 });
    expect(l.state).toBe("vehicles");
    expect(l.boxes.length).toBe(Math.min(3, l.perUnit));
  });
  it("says so when one piece is too big for the hold", () => {
    expect(cargoLayout("SEA", { cargoKind: "GENERAL", pieces: 1, piece: { lengthCm: 1500, widthCm: 300, heightCm: 300, weightKg: 1, stackable: false } }).state).toBe("too-big");
  });
});
