"use client";

import { useState } from "react";
import { fitGrid, spaceTotals, type Box } from "@/lib/fit";
import { CountUp } from "./CountUp";

const TRAILER: Box = { lengthCm: 1360, widthCm: 245, heightCm: 270 };

const PIECES = [
  { label: "Euro pallet", note: "120 × 80 × 150 cm", box: { lengthCm: 120, widthCm: 80, heightCm: 150 } },
  { label: "Industrial pallet", note: "120 × 100 × 150 cm", box: { lengthCm: 120, widthCm: 100, heightCm: 150 } },
  { label: "Your crates", note: "160 × 100 × 100 cm", box: { lengthCm: 160, widthCm: 100, heightCm: 100 } },
  { label: "Large carton", note: "60 × 40 × 40 cm", box: { lengthCm: 60, widthCm: 40, heightCm: 40 } },
];

const W = 560;

/** A carrier's empty trailer and one piece size: how many fit, seen from above. */
export function FitDemo() {
  const [i, setI] = useState(0);
  const [stack, setStack] = useState(false);
  const piece = PIECES[i];
  const fit = fitGrid(TRAILER, { ...piece.box, weightKg: 0, stackable: stack });
  const totals = spaceTotals(TRAILER);
  const scale = W / TRAILER.lengthCm;
  const H = Math.round(TRAILER.widthCm * scale);

  return (
    <div className="panel p-4 md:p-5">
      <div role="group" aria-label="Piece size" className="flex flex-wrap overflow-hidden rounded border border-rule">
        {PIECES.map((p, idx) => (
          <button
            key={p.label}
            type="button"
            aria-pressed={i === idx}
            onClick={() => setI(idx)}
            className={`min-h-[44px] flex-1 whitespace-nowrap px-3 text-sm font-semibold ${i === idx ? "bg-ink text-white" : "bg-panel hover:bg-paper"}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">{piece.note}. Empty space: a 13.6 m trailer, {totals.floorM2} m² of floor.</p>

      <label className="mt-1 flex min-h-[44px] cursor-pointer items-center gap-3">
        <input type="checkbox" checked={stack} onChange={(e) => setStack(e.target.checked)} />
        <span className="text-sm font-semibold">Pieces can be stacked 2 high</span>
      </label>

      <div className="mt-2" aria-live="polite">
        <p className="flex items-baseline gap-2">
          <span className="condensed text-[56px] font-bold leading-none"><CountUp value={fit.count} /></span>
          <span className="text-base">pieces fit</span>
          <span className="text-sm text-muted">
            {fit.cols} × {fit.rows} on the floor{fit.layers > 1 ? `, ${fit.layers} layers` : ""}{fit.rotated ? ", turned 90°" : ""}
          </span>
        </p>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full rounded border border-rule bg-panel" role="img" aria-label={`Top view of a trailer with ${fit.cols} by ${fit.rows} pieces on the floor`}>
        {/* key replays the fill when the piece or stacking changes */}
        <g key={`${i}-${stack}`}>
          {Array.from({ length: fit.rows }).flatMap((_, r) =>
            Array.from({ length: fit.cols }).map((__, c) => {
              const idx = c * fit.rows + r;
              return (
                <rect
                  key={`${r}-${c}`}
                  className="pop"
                  x={c * fit.placedLengthCm * scale + 1}
                  y={r * fit.placedWidthCm * scale + 1}
                  width={Math.max(1, fit.placedLengthCm * scale - 2)}
                  height={Math.max(1, fit.placedWidthCm * scale - 2)}
                  rx={2}
                  fill="#B45309"
                  fillOpacity={0.8}
                  style={{ animationDelay: `${Math.min(idx * 14, 600)}ms`, transformBox: "fill-box", transformOrigin: "center" }}
                />
              );
            }),
          )}
        </g>
      </svg>
      <p className="mt-2 text-xs text-muted">Top view. Pieces are placed in a grid, turned 90° when that fits more. An estimate for comparing offers, not a loading plan.</p>
    </div>
  );
}
