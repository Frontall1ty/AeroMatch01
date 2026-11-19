"use client";

import { useMemo, useState } from "react";
import { MODE_LABEL, type Mode } from "@/lib/constants";
import { cargoLayout, HOLDS, SHIP_SLOTS, type CargoInput, type Layout, type PlacedBox } from "@/lib/holds";

/**
 * The cargo space with its roof cut away, seen from above at an angle (or straight down), with the shipper's cargo
 * placed in it as they type. A picture of the space, not a loading plan.
 */
type View = "angled" | "top";
const AXES: Record<View, { ex: [number, number]; ey: [number, number]; ez: number }> = {
  angled: { ex: [0.97, 0.26], ey: [-0.46, 0.62], ez: 0.8 },
  top: { ex: [1, 0], ey: [0, 1], ez: 0 },
};
const S = 20; // drawing units per metre

type Pt = [number, number];
type Shade = { top: string; front: string; side: string; edge: string };

const CRATE: Shade = { top: "#E6C08A", front: "#B98A52", side: "#CF9F63", edge: "#80592F" };
const CAR: Shade = { top: "#CBD3DE", front: "#8C98A9", side: "#A9B3C2", edge: "#5B6676" };
const MINE: Shade = { top: "#FF8456", front: "#D3461A", side: "#E85A26", edge: "#9E2F0B" };

function projector(view: View) {
  const { ex, ey, ez } = AXES[view];
  return (x: number, y: number, z: number): Pt => [(x * ex[0] + y * ey[0]) * S, (x * ex[1] + y * ey[1] - z * ez) * S];
}
const pts = (list: Pt[]) => list.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

function BoxShape({ b, P, shade, active, onEnter, delay, label }: {
  b: { x: number; y: number; z: number; l: number; w: number; h: number };
  P: (x: number, y: number, z: number) => Pt;
  shade: Shade;
  active: boolean;
  onEnter?: () => void;
  delay: number;
  label?: string;
}) {
  const { x, y, z, l, w, h } = b;
  const top = [P(x, y, z + h), P(x + l, y, z + h), P(x + l, y + w, z + h), P(x, y + w, z + h)];
  const front = [P(x, y + w, z), P(x + l, y + w, z), P(x + l, y + w, z + h), P(x, y + w, z + h)];
  const side = [P(x + l, y, z), P(x + l, y + w, z), P(x + l, y + w, z + h), P(x + l, y, z + h)];
  return (
    <g className={`iso-box ${active ? "is-active" : ""}`} style={{ ["--d" as string]: `${delay}ms` }} onMouseEnter={onEnter}>
      {label && <title>{label}</title>}
      <polygon points={pts(side)} fill={shade.side} stroke={shade.edge} strokeWidth="0.6" strokeLinejoin="round" />
      <polygon points={pts(front)} fill={shade.front} stroke={shade.edge} strokeWidth="0.6" strokeLinejoin="round" />
      <polygon points={pts(top)} fill={shade.top} stroke={shade.edge} strokeWidth="0.6" strokeLinejoin="round" />
    </g>
  );
}

/** Wheels on the visible side of a vehicle. */
function Wheels({ P, xs, y, r = 0.48 }: { P: (x: number, y: number, z: number) => Pt; xs: number[]; y: number; r?: number }) {
  return (
    <g>
      {xs.map((x) => {
        const c = P(x, y, -r);
        return <ellipse key={x} cx={c[0]} cy={c[1]} rx={r * S * 0.95} ry={r * S * 0.85} fill="#1F2329" stroke="#0E0E10" strokeWidth="0.8" />;
      })}
    </g>
  );
}

function Scene({ mode, layout, view, active, setActive }: { mode: Mode; layout: Layout; view: View; active: number | null; setActive: (i: number | null) => void }) {
  const P = projector(view);
  const box = HOLDS[mode].box;
  const L = box.lengthCm / 100;
  const W = box.widthCm / 100;
  const H = box.heightCm / 100;
  const shade = layout.state === "vehicles" ? CAR : CRATE;
  const sorted = [...layout.boxes].sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x);
  const label = (b: PlacedBox) => `${layout.state === "vehicles" ? "Car" : layout.state === "estimate" ? "Pallet" : "Piece"} ${b.index + 1}${b.layer > 0 ? ", second layer" : ""}`;

  if (mode === "SEA") {
    const slotL = 12.2;
    const slotW = 2.44;
    const gap = 0.6;
    const deckL = SHIP_SLOTS.bays * (slotL + gap);
    const deckW = SHIP_SLOTS.rows * (slotW + gap) + gap;
    const hull: Pt[] = [P(-9, 0, 0), P(deckL + 2, 0, 0), P(deckL + 11, deckW / 2, 0), P(deckL + 2, deckW, 0), P(-9, deckW, 0)];
    const side: Pt[] = [P(-9, deckW, 0), P(deckL + 2, deckW, 0), P(deckL + 11, deckW / 2, 0), P(deckL + 9, deckW / 2, -3.2), P(deckL + 1, deckW, -3.2), P(-8, deckW, -3.2)];
    const slots = Array.from({ length: SHIP_SLOTS.bays * SHIP_SLOTS.rows }, (_, i) => {
      const bay = SHIP_SLOTS.bays - 1 - Math.floor(i / SHIP_SLOTS.rows);
      const row = i % SHIP_SLOTS.rows;
      return { x: bay * (slotL + gap) + gap / 2, y: gap + row * (slotW + gap), z: 0, l: slotL, w: slotW, h: 2.6, index: i };
    });
    const mine = Math.min(layout.units, slots.length);
    const drawn = slots.slice(0, mine).sort((a, b) => a.y - b.y || a.x - b.x);
    return (
      <g>
        <polygon points={pts(side)} fill="#1E3A5F" />
        <polygon points={pts(side.slice(3).concat([P(-8, deckW, -1.6), P(deckL + 1, deckW, -1.6), P(deckL + 10, deckW / 2, -1.6)]))} fill="#7A2A12" opacity="0.85" />
        <polygon points={pts(hull)} fill="#DCE2EA" stroke="#64748B" strokeWidth="0.8" />
        {slots.map((s) => {
          const r = [P(s.x, s.y, 0.01), P(s.x + s.l, s.y, 0.01), P(s.x + s.l, s.y + s.w, 0.01), P(s.x, s.y + s.w, 0.01)];
          return <polygon key={s.index} points={pts(r)} fill="none" stroke="#94A3B8" strokeWidth="0.8" strokeDasharray="3 2" />;
        })}
        <BoxShape b={{ x: -8, y: 0.8, z: 0, l: 5, w: deckW - 1.6, h: 7 }} P={P} shade={{ top: "#F4F4F2", front: "#D5DAE1", side: "#E6E9EE", edge: "#8A94A3" }} active={false} delay={0} />
        {drawn.map((s, i) => (
          <BoxShape key={`c${s.index}`} b={s} P={P} shade={MINE} active={active === i} onEnter={() => setActive(i)} delay={120 + i * 90} label={`Container ${i + 1} of ${layout.units}`} />
        ))}
      </g>
    );
  }

  const floor = [P(0, 0, 0), P(L, 0, 0), P(L, W, 0), P(0, W, 0)];
  const backWall = [P(0, 0, 0), P(L, 0, 0), P(L, 0, H), P(0, 0, H)];
  const endWall = [P(0, 0, 0), P(0, W, 0), P(0, W, H), P(0, 0, H)];
  const cut = [P(0, W, H), P(L, W, H), P(L, 0, H)];

  return (
    <g>
      {/* outside: the vehicle around the space */}
      {mode === "AIR" && (
        <g>
          <polygon points={pts([P(L * 0.55, 0, -0.2), P(L * 0.36, -10, -0.2), P(L * 0.27, -10, -0.2), P(L * 0.36, 0, -0.2)])} fill="#AAB4C2" />
          <polygon points={pts([P(-6.6, W / 2, 0), P(-3, W / 2, 0), P(-5.4, W / 2, 5), P(-7, W / 2, 5)])} fill="#2F4FD0" />
          <polygon
            points={pts([P(-7.5, W / 2 - 0.3, -0.25), P(-5, -0.7, -0.25), P(L + 1, -0.7, -0.25), P(L + 4.2, 0.2, -0.25), P(L + 6.4, W / 2, -0.25), P(L + 4.2, W - 0.2, -0.25), P(L + 1, W + 0.7, -0.25), P(-5, W + 0.7, -0.25), P(-7.5, W / 2 + 0.3, -0.25)])}
            fill="#EEF1F5"
            stroke="#94A3B8"
            strokeWidth="0.8"
          />
          <polygon points={pts([P(L + 3.6, W * 0.2, 0.6), P(L + 5.2, W * 0.4, 0.6), P(L + 5.2, W * 0.6, 0.6), P(L + 3.6, W * 0.8, 0.6)])} fill="#1F2937" />
          <polygon points={pts([P(L * 0.55, W, -0.2), P(L * 0.36, W + 10, -0.2), P(L * 0.27, W + 10, -0.2), P(L * 0.36, W, -0.2)])} fill="#C9D1DC" stroke="#94A3B8" strokeWidth="0.6" />
          <ellipse cx={P(L * 0.42, W + 3.2, -0.6)[0]} cy={P(L * 0.42, W + 3.2, -0.6)[1]} rx={S * 1.6} ry={S * 0.8} fill="#94A3B8" />
        </g>
      )}
      {mode === "RAIL" && (
        <g>
          <polygon points={pts([P(-0.4, -0.1, -0.35), P(L + 0.4, -0.1, -0.35), P(L + 0.4, W + 0.1, -0.35), P(-0.4, W + 0.1, -0.35)])} fill="#3F4650" />
          <Wheels P={P} y={W + 0.05} xs={[1.6, 3.2, L - 3.2, L - 1.6]} r={0.45} />
          <polygon points={pts([P(-1, W / 2 - 0.2, -0.2), P(-0.4, W / 2 - 0.2, -0.2), P(-0.4, W / 2 + 0.2, -0.2), P(-1, W / 2 + 0.2, -0.2)])} fill="#1F2329" />
        </g>
      )}
      {mode === "ROAD" && (
        <g>
          <polygon points={pts([P(0, 0.3, -0.3), P(L + 3, 0.3, -0.3), P(L + 3, W - 0.3, -0.3), P(0, W - 0.3, -0.3)])} fill="#2A2F36" />
          <Wheels P={P} y={W} xs={[1.1, 2.4, 3.7]} />
        </g>
      )}

      {/* the space, with the near walls and the roof cut away */}
      <polygon points={pts(floor)} fill="#ECE6DB" stroke="#9CA3AF" strokeWidth="0.8" />
      {view === "angled" && (
        <>
          <polygon points={pts(backWall)} fill="rgba(148,163,184,0.22)" stroke="#94A3B8" strokeWidth="0.8" />
          <polygon points={pts(endWall)} fill="rgba(148,163,184,0.32)" stroke="#94A3B8" strokeWidth="0.8" />
        </>
      )}
      {Array.from({ length: Math.floor(L) }, (_, i) => i + 1).map((m) => (
        <line key={m} x1={P(m, 0, 0)[0]} y1={P(m, 0, 0)[1]} x2={P(m, W, 0)[0]} y2={P(m, W, 0)[1]} stroke="#D7CFC0" strokeWidth="0.5" />
      ))}
      {sorted.map((b, i) => (
        <BoxShape key={b.index} b={b} P={P} shade={shade} active={active === b.index} onEnter={() => setActive(b.index)} delay={Math.min(i * 28, 900)} label={label(b)} />
      ))}
      {view === "angled" && <polyline points={pts(cut)} fill="none" stroke="#64748B" strokeWidth="0.9" strokeDasharray="4 3" />}

      {mode === "ROAD" && (
        <g>
          <BoxShape b={{ x: L + 0.35, y: 0, z: 0, l: 2.4, w: W, h: 3 }} P={P} shade={{ top: "#C2C9D3", front: "#FF5B1F", side: "#E14E15", edge: "#7A2A0D" }} active={false} delay={0} />
          <polygon points={pts([P(L + 2.75, W * 0.12, 1.5), P(L + 2.75, W * 0.88, 1.5), P(L + 2.75, W * 0.88, 2.6), P(L + 2.75, W * 0.12, 2.6)])} fill="#1F2937" opacity={view === "angled" ? 1 : 0} />
          <Wheels P={P} y={W} xs={[L + 0.9, L + 2.1]} />
        </g>
      )}
    </g>
  );
}

function bounds(mode: Mode, view: View): [number, number, number, number] {
  const P = projector(view);
  const b = HOLDS[mode].box;
  const L = b.lengthCm / 100;
  const W = b.widthCm / 100;
  const H = b.heightCm / 100;
  const corners: Pt[] = [];
  const add = (x: number, y: number, z: number) => corners.push(P(x, y, z));
  if (mode === "SEA") {
    const deckL = SHIP_SLOTS.bays * 12.8;
    const deckW = SHIP_SLOTS.rows * 3.04 + 0.6;
    for (const [x, y] of [[-9, 0], [deckL + 11, deckW / 2], [deckL + 2, deckW], [-9, deckW], [deckL + 2, 0]]) { add(x, y, 7.5); add(x, y, -3.4); }
  } else {
    const extra = mode === "AIR" ? { x0: -8, x1: L + 7, y0: -10.5, y1: W + 10.5, z1: 5.3 } : mode === "ROAD" ? { x0: -0.5, x1: L + 3.2, y0: -0.2, y1: W + 0.2, z1: 3.2 } : { x0: -1.2, x1: L + 0.6, y0: -0.2, y1: W + 0.2, z1: H };
    for (const x of [extra.x0, extra.x1]) for (const y of [extra.y0, extra.y1]) { add(x, y, extra.z1); add(x, y, -1); }
  }
  const xs = corners.map((c) => c[0]);
  const ys = corners.map((c) => c[1]);
  const pad = 6;
  return [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) - Math.min(...xs) + pad * 2, Math.max(...ys) - Math.min(...ys) + pad * 2];
}

export function summary(mode: Mode, l: Layout): string {
  const hold = l.hold;
  switch (l.state) {
    case "empty":
      return "Enter how many pieces and the size of one, and they appear here.";
    case "too-big":
      return `One piece is larger than a ${hold.name}. Check the size, or compare: another mode may take it.`;
    default: {
      const what = l.state === "estimate" ? `About ${l.count} Euro pallets (estimated from the total volume)` : `${l.count} ${l.noun}`;
      const units = l.units === 1 ? `fit in one ${hold.name}` : `need ${l.units} ${hold.plural}`;
      if (mode === "SEA") return `${what} ${units}, up to ${l.perUnit} in each. Your containers are shown in orange on the deck.`;
      return `${what} ${units}. One takes up to ${l.perUnit}${l.layers > 1 ? `, stacked ${l.layers} high` : ""}, using ${l.floorUsedPct}% of its floor.`;
    }
  }
}

/** `fit`: the picture shrinks to the height left in a fixed-size parent (a flex column), so the text below stays in view. */
export function HoldView({
  mode,
  cargo,
  dark = false,
  controls = true,
  fit = false,
  action,
  note,
  className = "",
}: {
  mode: Mode;
  cargo: CargoInput;
  dark?: boolean;
  controls?: boolean;
  fit?: boolean;
  /** A button placed next to the view switch, such as a way back. */
  action?: React.ReactNode;
  /** A line added to the small print. */
  note?: string;
  className?: string;
}) {
  const [view, setView] = useState<View>("angled");
  const [active, setActive] = useState<number | null>(null);
  const layout = useMemo(() => cargoLayout(mode, cargo), [mode, cargo]);
  const vb = useMemo(() => bounds(mode, view), [mode, view]);
  const text = summary(mode, layout);
  const activeBox = mode === "SEA" ? null : layout.boxes.find((b) => b.index === active);

  return (
    <div className={`${fit ? "flex min-h-0 flex-1 flex-col" : ""} ${className}`}>
      {controls && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className={`text-sm font-semibold ${dark ? "text-console-text" : ""}`}>
            {MODE_LABEL[mode]}: a {HOLDS[mode].name}, roof cut away
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="View" className={`flex overflow-hidden rounded border ${dark ? "border-white/20" : "border-rule"}`}>
              {(["angled", "top"] as View[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={`min-h-[36px] px-3 text-xs font-semibold transition-colors ${view === v ? (dark ? "bg-white text-ink" : "bg-ink text-white") : dark ? "text-console-text hover:bg-white/10" : "bg-panel hover:bg-paper"}`}
                >
                  {v === "angled" ? "Angled" : "From above"}
                </button>
              ))}
            </div>
            {action}
          </div>
        </div>
      )}
      <svg viewBox={vb.map((n) => n.toFixed(1)).join(" ")} className={`hold-svg w-full ${fit ? "min-h-[120px] flex-1" : ""}`} role="img" aria-label={text} onMouseLeave={() => setActive(null)}>
        <Scene key={`${mode}-${view}`} mode={mode} layout={layout} view={view} active={active} setActive={setActive} />
      </svg>
      <p className={`${fit ? "mt-2" : "mt-3 min-h-[40px]"} text-sm ${dark ? "text-console-muted" : "text-muted"}`} aria-live="polite">
        {activeBox ? `${layout.state === "vehicles" ? "Car" : layout.state === "estimate" ? "Pallet" : "Piece"} ${activeBox.index + 1} of ${layout.count}${activeBox.layer > 0 ? ", on the second layer" : ", on the floor"}. ` : ""}
        {text}
      </p>
      <p className={`text-xs ${dark ? "text-console-muted" : "text-muted"}`}>A typical size for the picture, not a loading plan. The carrier you choose decides the real one.{note ? ` ${note}` : ""}</p>
    </div>
  );
}
