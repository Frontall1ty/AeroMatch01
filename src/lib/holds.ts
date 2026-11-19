import type { Mode } from "./constants";
import { fitGrid, type Box } from "./fit";

/**
 * The cargo space drawn on the new-shipment page, one typical size per mode. Invented round figures for the
 * picture, not any carrier's real hold, and never a loading plan.
 */
export type HoldSpec = { name: string; plural: string; box: Box };

export const HOLDS: Record<Mode, HoldSpec> = {
  AIR: { name: "freighter main deck", plural: "freighters", box: { lengthCm: 2800, widthCm: 470, heightCm: 240 } },
  SEA: { name: "40 ft container", plural: "containers", box: { lengthCm: 1203, widthCm: 235, heightCm: 239 } },
  RAIL: { name: "covered wagon", plural: "wagons", box: { lengthCm: 1380, widthCm: 276, heightCm: 260 } },
  ROAD: { name: "trailer", plural: "trailers", box: { lengthCm: 1360, widthCm: 245, heightCm: 270 } },
};

/** Slots on the ship's deck, for the sea picture. */
export const SHIP_SLOTS = { bays: 8, rows: 4 };

const CAR = { lengthCm: 450, widthCm: 180, heightCm: 150, weightKg: 1500, stackable: false };
const EURO_PALLET = { lengthCm: 120, widthCm: 80, heightCm: 150, weightKg: 0, stackable: false };

export type CargoInput = {
  cargoKind: "GENERAL" | "VEHICLES";
  pieces?: number;
  piece?: { lengthCm: number; widthCm: number; heightCm: number; weightKg: number; stackable: boolean } | null;
  volumeM3?: number;
  vehicleCount?: number;
};

/** One box in the picture, in metres from the hold's rear left corner on the floor. */
export type PlacedBox = { x: number; y: number; z: number; l: number; w: number; h: number; index: number; layer: number };

export type Layout = {
  state: "empty" | "pieces" | "estimate" | "vehicles" | "too-big";
  hold: HoldSpec;
  /** What is drawn: crates, pallets or cars. */
  noun: string;
  count: number;
  perUnit: number;
  /** How many holds of this size the cargo needs. */
  units: number;
  /** Boxes in the first hold, the one drawn. */
  boxes: PlacedBox[];
  floorUsedPct: number;
  layers: number;
};

const valid = (n: number | undefined): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;

export function cargoLayout(mode: Mode, c: CargoInput): Layout {
  const hold = HOLDS[mode];
  let piece: (typeof CAR) | null = null;
  let count = 0;
  let state: Layout["state"] = "empty";
  let noun = "pieces";

  if (c.cargoKind === "VEHICLES") {
    if (valid(c.vehicleCount)) {
      piece = CAR;
      count = Math.floor(c.vehicleCount);
      state = "vehicles";
      noun = count === 1 ? "car" : "cars";
    }
  } else if (c.piece && valid(c.pieces) && [c.piece.lengthCm, c.piece.widthCm, c.piece.heightCm].every(valid)) {
    piece = { ...c.piece, weightKg: c.piece.weightKg || 0 };
    count = Math.floor(c.pieces);
    state = "pieces";
    noun = count === 1 ? "piece" : "pieces";
  } else if (valid(c.volumeM3)) {
    piece = EURO_PALLET;
    count = Math.max(1, Math.ceil(c.volumeM3 / ((1.2 * 0.8 * 1.5) * 0.9)));
    state = "estimate";
    noun = count === 1 ? "pallet" : "pallets";
  }

  const empty: Layout = { state, hold, noun, count, perUnit: 0, units: 0, boxes: [], floorUsedPct: 0, layers: 0 };
  if (!piece || count === 0) return { ...empty, state: "empty" };

  const fit = fitGrid(hold.box, piece);
  if (fit.count === 0) return { ...empty, state: "too-big" };

  const shown = Math.min(count, fit.count);
  const pl = fit.placedLengthCm / 100;
  const pw = fit.placedWidthCm / 100;
  const ph = piece.heightCm / 100;
  const L = hold.box.lengthCm / 100;
  const boxes: PlacedBox[] = [];
  for (let i = 0; i < shown; i++) {
    const layer = Math.floor(i / fit.perLayer);
    const k = i % fit.perLayer;
    const col = Math.floor(k / fit.rows);
    const row = k % fit.rows;
    // loaded from the front wall towards the doors
    boxes.push({ x: L - (col + 1) * pl, y: row * pw, z: layer * ph, l: pl, w: pw, h: ph, index: i, layer });
  }
  const firstLayer = Math.min(shown, fit.perLayer);
  return {
    state,
    hold,
    noun,
    count,
    perUnit: fit.count,
    units: Math.ceil(count / fit.count),
    boxes,
    floorUsedPct: Math.round(((firstLayer * fit.placedLengthCm * fit.placedWidthCm) / (hold.box.lengthCm * hold.box.widthCm)) * 100),
    layers: boxes.length ? Math.max(...boxes.map((b) => b.layer)) + 1 : 0,
  };
}
