/**
 * How pieces fit into a space. All sizes in cm, weights in kg.
 * These are estimates for comparing offers, not a loading plan.
 */

/** Share of the floor that can really be used (gaps, turning room). Verify with a road or rail forwarder. */
export const PACKING_EFFICIENCY = 0.9;
/** A stackable piece is assumed to stack this many high. */
export const STACK_LAYERS = 2;

export type PieceDims = {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
  stackable: boolean;
};

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Floor space one piece needs, counting stacking and the usable share of the floor. */
export function floorPerPieceM2(p: PieceDims): number {
  const footprint = (p.lengthCm * p.widthCm) / 10_000;
  return footprint / (p.stackable ? STACK_LAYERS : 1) / PACKING_EFFICIENCY;
}

/** Weight, volume and floor space of a whole shipment described piece by piece. */
export function totalsFromPieces(count: number, p: PieceDims) {
  return {
    weightKg: round2(count * p.weightKg),
    volumeM3: round2((count * p.lengthCm * p.widthCm * p.heightCm) / 1_000_000),
    floorAreaM2: round1(count * floorPerPieceM2(p)),
    heaviestPieceKg: p.weightKg,
  };
}

/** How many pieces like this fit in a given amount of free floor space. */
export function piecesThatFit(freeFloorM2: number, p: PieceDims): number {
  const per = floorPerPieceM2(p);
  if (!(per > 0) || !(freeFloorM2 > 0)) return 0;
  return Math.floor(freeFloorM2 / per + 1e-9);
}

/* ---------- Geometric fit, for the carrier's space calculator ---------- */

export type Box = { lengthCm: number; widthCm: number; heightCm: number };

export type GridFit = {
  count: number;
  perLayer: number;
  layers: number;
  /** Pieces along the length and across the width, in the chosen orientation. */
  cols: number;
  rows: number;
  /** Piece footprint as placed: length along the space length. */
  placedLengthCm: number;
  placedWidthCm: number;
  rotated: boolean;
  floorUsedPct: number;
  /** True when the weight limit, not the space, stopped the count. */
  limitedByWeight: boolean;
};

/**
 * Places identical pieces in a grid, trying both orientations on the floor,
 * and stacking up to STACK_LAYERS when the piece is stackable.
 */
export function fitGrid(
  space: Box,
  piece: Pick<PieceDims, "lengthCm" | "widthCm" | "heightCm" | "stackable" | "weightKg">,
  maxWeightKg?: number,
): GridFit {
  const a = {
    cols: Math.floor(space.lengthCm / piece.lengthCm),
    rows: Math.floor(space.widthCm / piece.widthCm),
    pl: piece.lengthCm,
    pw: piece.widthCm,
    rotated: false,
  };
  const b = {
    cols: Math.floor(space.lengthCm / piece.widthCm),
    rows: Math.floor(space.widthCm / piece.lengthCm),
    pl: piece.widthCm,
    pw: piece.lengthCm,
    rotated: true,
  };
  const best = b.cols * b.rows > a.cols * a.rows ? b : a;

  const fitsHeight = piece.heightCm <= space.heightCm;
  const layers = !fitsHeight ? 0 : piece.stackable ? Math.max(1, Math.min(STACK_LAYERS, Math.floor(space.heightCm / piece.heightCm))) : 1;
  const perLayer = best.cols * best.rows;
  let count = perLayer * layers;

  let limitedByWeight = false;
  if (maxWeightKg != null && piece.weightKg > 0) {
    const byWeight = Math.floor(maxWeightKg / piece.weightKg);
    if (byWeight < count) {
      count = byWeight;
      limitedByWeight = true;
    }
  }

  const floor = space.lengthCm * space.widthCm;
  return {
    count,
    perLayer,
    layers,
    cols: best.cols,
    rows: best.rows,
    placedLengthCm: best.pl,
    placedWidthCm: best.pw,
    rotated: best.rotated,
    floorUsedPct: floor > 0 ? Math.round(((perLayer * best.pl * best.pw) / floor) * 100) : 0,
    limitedByWeight,
  };
}

/** Floor area and volume of a space, in m² and m³. */
export function spaceTotals(space: Box) {
  return {
    floorM2: round1((space.lengthCm * space.widthCm) / 10_000),
    volumeM3: round1((space.lengthCm * space.widthCm * space.heightCm) / 1_000_000),
  };
}

export const SPACE_PRESETS: { label: string; box: Box }[] = [
  { label: "Standard trailer, 13.6 m", box: { lengthCm: 1360, widthCm: 245, heightCm: 270 } },
  { label: "40 ft container", box: { lengthCm: 1203, widthCm: 235, heightCm: 239 } },
  { label: "20 ft container", box: { lengthCm: 590, widthCm: 235, heightCm: 239 } },
  { label: "Rail platform, 40 m²", box: { lengthCm: 1360, widthCm: 294, heightCm: 250 } },
];

export const PIECE_PRESETS: { label: string; box: Omit<PieceDims, "weightKg" | "stackable"> }[] = [
  { label: "Euro pallet, 120 × 80 × 150", box: { lengthCm: 120, widthCm: 80, heightCm: 150 } },
  { label: "Industrial pallet, 120 × 100 × 150", box: { lengthCm: 120, widthCm: 100, heightCm: 150 } },
  { label: "Large carton, 60 × 40 × 40", box: { lengthCm: 60, widthCm: 40, heightCm: 40 } },
];
