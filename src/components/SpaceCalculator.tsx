"use client";

import { useState } from "react";
import { fitGrid, PIECE_PRESETS, SPACE_PRESETS, spaceTotals } from "@/lib/fit";
import { toNumber } from "./Field";

type Props = {
  /** Called when the carrier accepts the space: floor in m² and volume in m³. */
  onUse: (space: { floorM2: number; volumeM3: number }) => void;
};

export function SpaceCalculator({ onUse }: Props) {
  const [space, setSpace] = useState({ l: "1360", w: "245", h: "270" });
  const [piece, setPiece] = useState({ l: "120", w: "80", h: "150", kg: "", stack: false });
  const [maxKg, setMaxKg] = useState("");

  const s = { lengthCm: toNumber(space.l), widthCm: toNumber(space.w), heightCm: toNumber(space.h) };
  const p = { lengthCm: toNumber(piece.l), widthCm: toNumber(piece.w), heightCm: toNumber(piece.h) };
  const spaceOk = Object.values(s).every((x) => Number.isFinite(x) && x > 0);
  const pieceOk = Object.values(p).every((x) => Number.isFinite(x) && x > 0);
  const kgEach = toNumber(piece.kg);
  const limit = toNumber(maxKg);

  const totals = spaceOk ? spaceTotals(s) : null;
  const fit =
    spaceOk && pieceOk
      ? fitGrid(s, { ...p, weightKg: Number.isFinite(kgEach) ? kgEach : 0, stackable: piece.stack }, Number.isFinite(limit) && limit > 0 ? limit : undefined)
      : null;

  // Top-down diagram, scaled to a 560 px wide box.
  const W = 560;
  const scale = spaceOk ? W / s.lengthCm : 1;
  const H = spaceOk ? Math.max(40, s.widthCm * scale) : 40;

  return (
    <details className="mt-5 rounded border border-rule px-4 py-3">
      <summary className="cursor-pointer text-sm font-semibold">Space calculator: how many pieces fit?</summary>

      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <fieldset>
          <legend className="field-label">Your empty space (cm)</legend>
          <select
            aria-label="Common spaces"
            className="mb-2 text-sm"
            value=""
            onChange={(e) => {
              const preset = SPACE_PRESETS[Number(e.target.value)];
              if (preset) setSpace({ l: String(preset.box.lengthCm), w: String(preset.box.widthCm), h: String(preset.box.heightCm) });
            }}
          >
            <option value="">Common spaces</option>
            {SPACE_PRESETS.map((x, i) => <option key={x.label} value={i}>{x.label}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-2">
            {([["l", "Length"], ["w", "Width"], ["h", "Height"]] as const).map(([k, label]) => (
              <div key={k}>
                <label htmlFor={`sp-${k}`} className="sr-only">{label} of the space (cm)</label>
                <input id={`sp-${k}`} inputMode="decimal" placeholder={label} value={space[k]} onChange={(e) => setSpace((v) => ({ ...v, [k]: e.target.value }))} />
              </div>
            ))}
          </div>
          {totals && <p className="field-hint">That is {totals.floorM2} m² of floor and {totals.volumeM3} m³.</p>}
        </fieldset>

        <fieldset>
          <legend className="field-label">One piece (cm)</legend>
          <select
            aria-label="Common piece sizes"
            className="mb-2 text-sm"
            value=""
            onChange={(e) => {
              const preset = PIECE_PRESETS[Number(e.target.value)];
              if (preset) setPiece((v) => ({ ...v, l: String(preset.box.lengthCm), w: String(preset.box.widthCm), h: String(preset.box.heightCm) }));
            }}
          >
            <option value="">Common sizes</option>
            {PIECE_PRESETS.map((x, i) => <option key={x.label} value={i}>{x.label}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-2">
            {([["l", "Length"], ["w", "Width"], ["h", "Height"]] as const).map(([k, label]) => (
              <div key={k}>
                <label htmlFor={`pc-${k}`} className="sr-only">{label} of one piece (cm)</label>
                <input id={`pc-${k}`} inputMode="decimal" placeholder={label} value={piece[k]} onChange={(e) => setPiece((v) => ({ ...v, [k]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="pc-kg" className="sr-only">Weight of one piece (kg)</label>
              <input id="pc-kg" inputMode="decimal" placeholder="Piece kg" value={piece.kg} onChange={(e) => setPiece((v) => ({ ...v, kg: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="sp-max" className="sr-only">Weight you can carry (kg)</label>
              <input id="sp-max" inputMode="decimal" placeholder="Load limit kg" value={maxKg} onChange={(e) => setMaxKg(e.target.value)} />
            </div>
          </div>
          <label className="mt-1 flex min-h-[44px] cursor-pointer items-center gap-3">
            <input type="checkbox" checked={piece.stack} onChange={(e) => setPiece((v) => ({ ...v, stack: e.target.checked }))} />
            <span className="text-sm font-semibold">Pieces can be stacked 2 high</span>
          </label>
        </fieldset>
      </div>

      <div aria-live="polite" className="mt-3">
        {fit ? (
          <>
            <p className="text-base">
              <span className="text-2xl font-bold">{fit.count}</span> pieces fit
              <span className="text-muted">
                {" "}
                ({fit.cols} × {fit.rows} on the floor{fit.layers > 1 ? `, ${fit.layers} layers` : ""}
                {fit.rotated ? ", turned 90°" : ""}).
              </span>
              {fit.limitedByWeight && <span className="ml-1 font-semibold text-road">The weight limit stops it before the space does.</span>}
              {fit.count === 0 && <span className="ml-1 font-semibold text-bad">The piece is too big for this space.</span>}
            </p>
            <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full max-w-[560px] rounded border border-rule bg-paper" role="img" aria-label={`Top view: ${fit.cols} by ${fit.rows} pieces on the floor`}>
              <rect x={0} y={0} width={W} height={H} fill="#FFFFFF" />
              {Array.from({ length: fit.rows }).flatMap((_, r) =>
                Array.from({ length: fit.cols }).map((__, c) => (
                  <rect
                    key={`${r}-${c}`}
                    x={c * fit.placedLengthCm * scale + 1}
                    y={r * fit.placedWidthCm * scale + 1}
                    width={fit.placedLengthCm * scale - 2}
                    height={fit.placedWidthCm * scale - 2}
                    fill="#2F4FD0"
                    fillOpacity={0.75}
                    rx={2}
                  />
                )),
              )}
            </svg>
            <p className="field-hint">Top view of the floor. An estimate for comparing offers, not a loading plan.</p>
          </>
        ) : (
          <p className="text-sm text-muted">Enter the space and the size of one piece to see how many fit.</p>
        )}
      </div>

      {totals && (
        <button
          type="button"
          className="btn-secondary mt-3"
          onClick={() => onUse({ floorM2: totals.floorM2, volumeM3: totals.volumeM3 })}
        >
          Use this space for my listing
        </button>
      )}
    </details>
  );
}
