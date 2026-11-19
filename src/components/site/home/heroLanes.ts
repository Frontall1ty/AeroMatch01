import type { Mode } from "@/lib/constants";

/**
 * The vehicles that travel across the hero map. Each one only uses a mode that really runs between those two cities
 * in the app (a test checks it), so no ship ever sails out of Tashkent.
 */
export type Mover = { from: string; to: string; mode: Mode; seconds: number; delay: number };

export const MOVERS: Mover[] = [
  { from: "TAS", to: "IST", mode: "AIR", seconds: 9, delay: 0 },
  { from: "DXB", to: "TAS", mode: "AIR", seconds: 8, delay: 2.5 },
  { from: "TAS", to: "ALA", mode: "ROAD", seconds: 7, delay: 1 },
  { from: "ALA", to: "URC", mode: "RAIL", seconds: 8, delay: 3 },
  { from: "URC", to: "PEK", mode: "RAIL", seconds: 10, delay: 0.5 },
  { from: "IKA", to: "IST", mode: "ROAD", seconds: 9, delay: 4 },
  { from: "WAW", to: "HAM", mode: "RAIL", seconds: 7, delay: 2 },
  { from: "RTM", to: "JFK", mode: "SEA", seconds: 16, delay: 0 },
  { from: "PVG", to: "LAX", mode: "SEA", seconds: 18, delay: 5 },
  { from: "DXB", to: "BOM", mode: "SEA", seconds: 11, delay: 1.5 },
  { from: "KHI", to: "DXB", mode: "SEA", seconds: 10, delay: 6 },
  { from: "FRA", to: "PVG", mode: "AIR", seconds: 12, delay: 4 },
  { from: "LHR", to: "JFK", mode: "AIR", seconds: 11, delay: 7 },
  { from: "CAI", to: "IST", mode: "AIR", seconds: 8, delay: 5.5 },
  { from: "DEL", to: "BOM", mode: "ROAD", seconds: 8, delay: 2 },
];
