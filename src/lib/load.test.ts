import { describe, expect, it } from "vitest";
import { LOAD_CELLS, cellState, fakeRef, loadKind, loadLayout } from "./load";

describe("which vehicle is drawn", () => {
  it("follows the mode and the equipment", () => {
    expect(loadKind("AIR", "Freighter")).toBe("plane");
    expect(loadKind("ROAD", "Tent trailer, 82 m³")).toBe("truck");
    expect(loadKind("RAIL", "Covered wagon")).toBe("wagon");
    expect(loadKind("RAIL", "Container platform, 40 m² floor")).toBe("container");
    expect(loadKind("SEA", "Container, 40 ft")).toBe("ship");
  });
});

describe("the load layout", () => {
  it("splits the positions into booked, yours and free, and they add up", () => {
    for (const cells of [10, 12, 16, 24]) {
      const l = loadLayout({ total: 30000, free: 22000, yours: 6000, cells });
      expect(l.bookedCells + l.yoursCells + l.freeCells).toBe(cells);
    }
  });
  it("shows the share that is loaded, yours and still free", () => {
    const l = loadLayout({ total: 30000, free: 24000, yours: 6000, cells: 10 });
    expect(l.loadedPct).toBe(40); // 6,000 booked plus 6,000 yours of 30,000
    expect(l.yoursPct).toBe(20);
    expect(l.freePct).toBe(60);
    expect(l.fits).toBe(true);
    expect(l.bookedCells).toBe(2);
    expect(l.yoursCells).toBe(2);
    expect(l.freeCells).toBe(6);
  });
  it("always shows your cargo as at least one position", () => {
    expect(loadLayout({ total: 100000, free: 100000, yours: 10, cells: 12 }).yoursCells).toBe(1);
  });
  it("shows no position of yours when there is no cargo", () => {
    expect(loadLayout({ total: 1000, free: 800, yours: 0, cells: 12 }).yoursCells).toBe(0);
  });
  it("never lets your cargo take more than the free positions", () => {
    const l = loadLayout({ total: 1000, free: 300, yours: 5000, cells: 12 });
    expect(l.fits).toBe(false);
    expect(l.bookedCells + l.yoursCells).toBeLessThanOrEqual(12);
    expect(l.freeCells).toBeGreaterThanOrEqual(0);
    expect(l.loadedPct).toBeLessThanOrEqual(100);
  });
  it("falls back to the free space when the original capacity is unknown", () => {
    const l = loadLayout({ total: null, free: 20000, yours: 5000, cells: 10 });
    expect(l.cap).toBe(20000);
    expect(l.bookedCells).toBe(0);
  });
  it("fills from the front: booked, then yours, then free", () => {
    const layout = { bookedCells: 2, yoursCells: 3 };
    const states = Array.from({ length: 8 }, (_, i) => cellState(i, layout));
    expect(states).toEqual(["booked", "booked", "yours", "yours", "yours", "free", "free", "free"]);
  });
  it("every vehicle has a sensible number of positions", () => {
    for (const { cols, rows } of Object.values(LOAD_CELLS)) {
      expect(cols * rows).toBeGreaterThanOrEqual(10);
      expect(cols * rows).toBeLessThanOrEqual(24);
    }
  });
});

describe("invented references", () => {
  it("are short, stable and different per position", () => {
    expect(fakeRef("offer-1", 0)).toBe(fakeRef("offer-1", 0));
    expect(fakeRef("offer-1", 0)).toMatch(/^#[A-Z0-9]{1,3}$/);
    expect(new Set([0, 1, 2, 3, 4, 5].map((i) => fakeRef("offer-1", i))).size).toBeGreaterThan(3);
  });
});
