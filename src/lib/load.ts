import type { Mode } from "./constants";

/**
 * The load view: a cutaway of the vehicle split into positions, filled by what others have booked,
 * what your cargo takes and what stays free. The positions are a picture of the space, not a loading plan.
 */
export type LoadKind = "truck" | "plane" | "wagon" | "container" | "ship";

export function loadKind(mode: Mode, equipment: string): LoadKind {
  if (mode === "AIR") return "plane";
  if (mode === "SEA") return "ship";
  if (mode === "RAIL") return equipment.toLowerCase().includes("container") ? "container" : "wagon";
  return "truck";
}

export const LOAD_NAME: Record<LoadKind, string> = {
  truck: "Truck trailer",
  plane: "Aircraft hold",
  wagon: "Rail wagon",
  container: "Container on a rail platform",
  ship: "Container ship",
};

/** How many positions each vehicle is drawn with. */
export const LOAD_CELLS: Record<LoadKind, { cols: number; rows: number }> = {
  truck: { cols: 12, rows: 2 },
  plane: { cols: 10, rows: 1 },
  wagon: { cols: 6, rows: 2 },
  container: { cols: 6, rows: 2 },
  ship: { cols: 8, rows: 3 },
};

export type LoadLayout = {
  /** Original capacity. */
  cap: number;
  bookedCells: number;
  yoursCells: number;
  freeCells: number;
  /** Booked by others plus your cargo, as a share of the capacity. */
  loadedPct: number;
  yoursPct: number;
  /** What stays free after your cargo. */
  freePct: number;
  /** True when your cargo fits in the free space. */
  fits: boolean;
};

export function loadLayout(args: { total: number | null; free: number; yours: number; cells: number }): LoadLayout {
  const { free, yours, cells } = args;
  const cap = Math.max(args.total ?? free, free, 1);
  const booked = Math.max(0, cap - free);
  const yoursFit = Math.min(Math.max(0, yours), free);

  const bookedCells = Math.min(cells, Math.round((booked / cap) * cells));
  // Your cargo always shows as at least one position, and never takes more than what is left.
  const yoursCells = yoursFit > 0 ? Math.min(cells - bookedCells, Math.max(1, Math.round((yoursFit / cap) * cells))) : 0;

  return {
    cap,
    bookedCells,
    yoursCells,
    freeCells: cells - bookedCells - yoursCells,
    loadedPct: Math.round(((booked + yoursFit) / cap) * 100),
    yoursPct: Math.round((yoursFit / cap) * 100),
    freePct: Math.round((Math.max(0, free - yoursFit) / cap) * 100),
    fits: yours <= free,
  };
}

export type CellState = "booked" | "yours" | "free";

/** Positions fill from the front: booked first, then yours, then free. */
export function cellState(index: number, layout: Pick<LoadLayout, "bookedCells" | "yoursCells">): CellState {
  if (index < layout.bookedCells) return "booked";
  if (index < layout.bookedCells + layout.yoursCells) return "yours";
  return "free";
}

/** A short made-up reference for a booked position, such as "#B47". Invented, stable per offer and position. */
export function fakeRef(seed: string, index: number): string {
  let h = 5381;
  for (const ch of `${seed}:${index}`) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return `#${h.toString(36).slice(-3).toUpperCase()}`;
}
