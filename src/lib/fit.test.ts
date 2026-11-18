import { describe, expect, it } from "vitest";
import { fitGrid, floorPerPieceM2, piecesThatFit, spaceTotals, totalsFromPieces, type PieceDims } from "./fit";

const crate: PieceDims = { lengthCm: 160, widthCm: 100, heightCm: 100, weightKg: 240, stackable: true };

describe("shipment totals from pieces", () => {
  it("adds up weight, volume and floor space (stacked 2 high, 90% usable floor)", () => {
    expect(totalsFromPieces(25, crate)).toEqual({
      weightKg: 6000,
      volumeM3: 40,
      floorAreaM2: 22.2,
      heaviestPieceKg: 240,
    });
  });
  it("needs twice the floor when the pieces cannot be stacked", () => {
    expect(floorPerPieceM2({ ...crate, stackable: false })).toBeCloseTo(2 * floorPerPieceM2(crate), 6);
  });
});

describe("pieces that fit in free floor space", () => {
  it("counts how many pieces like these fit", () => {
    expect(piecesThatFit(33, crate)).toBe(37); // 33 / 0.8889
  });
  it("is zero with no free space or no piece size", () => {
    expect(piecesThatFit(0, crate)).toBe(0);
    expect(piecesThatFit(33, { ...crate, lengthCm: 0 })).toBe(0);
  });
});

describe("geometric fit for the carrier's space calculator", () => {
  const trailer = { lengthCm: 1360, widthCm: 245, heightCm: 270 };
  const euro = { lengthCm: 120, widthCm: 80, heightCm: 150, weightKg: 0, stackable: false };

  it("fits euro pallets in a 13.6 m trailer (about 33 on the floor, a few more with the best orientation)", () => {
    const f = fitGrid(trailer, euro);
    expect(f.count).toBeGreaterThanOrEqual(33);
    expect(f.count).toBeLessThanOrEqual(36);
    expect(f.layers).toBe(1);
  });
  it("stacks two high when the piece is stackable and the height allows", () => {
    const one = fitGrid(trailer, euro);
    const two = fitGrid(trailer, { ...euro, heightCm: 120, stackable: true });
    expect(two.layers).toBe(2);
    expect(two.count).toBe(one.perLayer * 2);
  });
  it("does not stack when the pieces are too tall for two layers", () => {
    const f = fitGrid(trailer, { ...euro, heightCm: 150, stackable: true });
    expect(f.layers).toBe(1);
  });
  it("fits nothing when the piece is taller than the space", () => {
    expect(fitGrid(trailer, { ...euro, heightCm: 300 }).count).toBe(0);
  });
  it("turns pieces 90 degrees when that fits more", () => {
    const long = fitGrid({ lengthCm: 500, widthCm: 130, heightCm: 200 }, { lengthCm: 130, widthCm: 100, heightCm: 100, weightKg: 0, stackable: false });
    expect(long.rotated).toBe(true);
    expect(long.count).toBe(5);
  });
  it("stops at the weight limit and says so", () => {
    const f = fitGrid(trailer, { ...euro, weightKg: 500 }, 10_000);
    expect(f.count).toBe(20);
    expect(f.limitedByWeight).toBe(true);
  });
  it("gives the floor and volume of a space", () => {
    expect(spaceTotals(trailer)).toEqual({ floorM2: 33.3, volumeM3: 90 });
  });
});
