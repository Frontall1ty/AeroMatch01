import type { Mode } from "@/lib/constants";

/** Invented shipments for the site board. Each pair of cities really has that mode in the app (a test checks it). */
export const BOARD_ROWS: { id: string; from: string; to: string; mode: Mode; eta: string; status: string; tone?: "warn" | "done" | "go" }[] = [
  { id: "AM-2048", from: "IST", to: "FRA", mode: "ROAD", eta: "15:34", status: "DELAYED 12 H", tone: "warn" },
  { id: "AM-1913", from: "PVG", to: "LAX", mode: "SEA", eta: "OCT 28", status: "LOADING" },
  { id: "AM-2201", from: "DXB", to: "FRA", mode: "AIR", eta: "10:32", status: "BOARDING", tone: "go" },
  { id: "AM-1777", from: "HAM", to: "URC", mode: "RAIL", eta: "NOV 02", status: "ARRIVED", tone: "done" },
  { id: "AM-2310", from: "BOM", to: "KHI", mode: "SEA", eta: "OCT 24", status: "CUSTOMS OK", tone: "go" },
  { id: "AM-2056", from: "TAS", to: "ALA", mode: "ROAD", eta: "19:24", status: "LOADING" },
  { id: "AM-2117", from: "TAS", to: "IST", mode: "AIR", eta: "07:10", status: "IN TRANSIT", tone: "go" },
  { id: "AM-1990", from: "RTM", to: "IST", mode: "SEA", eta: "NOV 09", status: "IN TRANSIT", tone: "go" },
];
