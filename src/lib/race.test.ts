import { describe, expect, it } from "vitest";
import { BOARD_ROWS } from "@/components/site/boardData";
import { modesBetween } from "./places";
import { formatDays, raceLanes } from "./race";
import { recommend } from "./decision";

describe("sample shipments on the site board", () => {
  it("only use a mode that really runs between the two cities", () => {
    for (const r of BOARD_ROWS) expect(modesBetween(r.from, r.to), `${r.id} ${r.from}-${r.to}`).toContain(r.mode);
  });
});

describe("the race", () => {
  it("has road and rail over 5,800 km on one landmass, and air is fastest", () => {
    const lanes = raceLanes(5800, false);
    expect(lanes.every((l) => l.available)).toBe(true);
    const fastest = [...lanes].sort((a, b) => a.days - b.days)[0];
    expect(fastest.mode).toBe("AIR");
    const cheapest = [...lanes].sort((a, b) => a.price - b.price)[0];
    expect(cheapest.mode).toBe("SEA");
  });
  it("takes road and rail away across an ocean, and road past 6,500 km", () => {
    const sea = raceLanes(8000, true);
    expect(sea.filter((l) => l.available).map((l) => l.mode).sort()).toEqual(["AIR", "SEA"]);
    expect(raceLanes(7000, false).find((l) => l.mode === "ROAD")?.available).toBe(false);
    expect(raceLanes(7000, false).find((l) => l.mode === "RAIL")?.available).toBe(true);
  });
  it("picks by the chosen priority", () => {
    const offers = raceLanes(5800, false).map((l) => ({ id: l.mode, totalPrice: l.price, transitDaysMin: l.days, transitDaysMax: l.days, safetyScore: l.safety }));
    expect(recommend(offers, "FASTEST").recommended?.id).toBe("AIR");
    expect(recommend(offers, "CHEAPEST").recommended?.id).toBe("RAIL");
    expect(recommend(offers, "SAFEST").recommended?.id).toBe("AIR");
  });
  it("writes times as hours under two days", () => {
    expect(formatDays(0.9)).toBe("22 h");
    expect(formatDays(4.14)).toBe("4.1 days");
  });
});
