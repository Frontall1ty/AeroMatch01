import { MAX_RAIL_KM, MAX_ROAD_KM } from "./places";
import { SAFETY_BY_MODE, type Mode } from "./constants";

/**
 * The race on the site: how the four ways compare over a distance, per tonne of cargo.
 * Invented, round demo figures. Handling time at both ends is in the fixed days. They are not quotes.
 * The limits are the same ones the app uses to decide which modes exist between two cities.
 */
const MODEL: Record<Mode, { fixedDays: number; kmPerDay: number; basePrice: number; perKm: number }> = {
  AIR: { fixedDays: 0.8, kmPerDay: 8000, basePrice: 150, perKm: 0.65 },
  RAIL: { fixedDays: 1.5, kmPerDay: 500, basePrice: 60, perKm: 0.065 },
  ROAD: { fixedDays: 0.5, kmPerDay: 750, basePrice: 40, perKm: 0.13 },
  SEA: { fixedDays: 4, kmPerDay: 450, basePrice: 90, perKm: 0.02 },
};

export type RaceLane = {
  mode: Mode;
  available: boolean;
  /** Why it is missing, when it is. */
  reason: string | null;
  days: number;
  price: number;
  safety: number;
};

export const RACE_MIN_KM = 300;
export const RACE_MAX_KM = 12000;

export function raceLanes(km: number, crossesOcean: boolean): RaceLane[] {
  const lane = (mode: Mode): RaceLane => {
    const m = MODEL[mode];
    let reason: string | null = null;
    if (crossesOcean && (mode === "ROAD" || mode === "RAIL")) reason = `No ${mode === "ROAD" ? "road" : "rail"} across an ocean`;
    else if (mode === "ROAD" && km > MAX_ROAD_KM) reason = `Road stops at ${MAX_ROAD_KM.toLocaleString("en-US")} km`;
    else if (mode === "RAIL" && km > MAX_RAIL_KM) reason = `Rail stops at ${MAX_RAIL_KM.toLocaleString("en-US")} km`;
    return {
      mode,
      available: reason === null,
      reason,
      days: Math.round((m.fixedDays + km / m.kmPerDay) * 10) / 10,
      price: Math.round(m.basePrice + m.perKm * km),
      safety: SAFETY_BY_MODE[mode],
    };
  };
  return (["ROAD", "RAIL", "SEA", "AIR"] as Mode[]).map(lane);
}

/** "21 h" under two days, "4.1 days" otherwise. */
export function formatDays(days: number): string {
  return days < 2 ? `${Math.round(days * 24)} h` : `${days.toFixed(1)} days`;
}
