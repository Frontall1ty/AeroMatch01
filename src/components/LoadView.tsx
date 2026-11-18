import type { Mode } from "@/lib/constants";
import { LOAD_CELLS, LOAD_NAME, cellState, fakeRef, loadKind, loadLayout, type CellState, type LoadKind } from "@/lib/load";

/**
 * A cutaway of the vehicle with its space split into positions. Grey is booked by others, the mode color is your
 * cargo, white is free. It is a picture of how full the vehicle is, not a loading plan.
 */
const COLOR: Record<Mode, string> = { AIR: "#1D4ED8", SEA: "#6D28D9", RAIL: "#0F766E", ROAD: "#B45309" };
const INK = "#111827";

type Area = { x: number; y: number; w: number; h: number };

function Cells({
  area, cols, rows, layout, mode, seed, text, kg,
}: {
  area: Area; cols: number; rows: number;
  layout: { bookedCells: number; yoursCells: number };
  mode: Mode; seed: string; text: boolean;
  /** Capacity of one position, for the invented booked labels. */
  kg: number;
}) {
  const gap = 2;
  const cw = area.w / cols;
  const ch = area.h / rows;
  const out = [];
  let firstYours = true;
  for (let i = 0; i < cols * rows; i++) {
    const col = Math.floor(i / rows);
    const row = i % rows;
    const state: CellState = cellState(i, layout);
    const x = area.x + col * cw + gap / 2;
    const y = area.y + row * ch + gap / 2;
    const w = cw - gap;
    const h = ch - gap;
    out.push(
      <g key={i}>
        <rect
          x={x} y={y} width={w} height={h} rx={2}
          fill={state === "yours" ? COLOR[mode] : state === "booked" ? "#D3D9E2" : "#FFFFFF"}
          stroke={state === "yours" ? INK : state === "booked" ? "#9CA3AF" : "#B6BFCC"}
          strokeWidth={state === "yours" ? 1.6 : 1}
          strokeDasharray={state === "free" ? "3 2" : undefined}
        />
        {text && state === "booked" && w > 18 && row === 0 && (
          <>
            <text x={x + 3} y={y + 9} fontSize="7" fontWeight="700" fill="#374151">{fakeRef(seed, i)}</text>
            {h > 24 && w > 30 && <text x={x + 3} y={y + 18} fontSize="6" fill="#4B5563">{Math.max(10, Math.round(kg / 10) * 10)} kg</text>}
          </>
        )}
        {text && state === "yours" && firstYours && (
          <text x={x + 3} y={y + 10} fontSize="7" fontWeight="700" fill="#FFFFFF">You</text>
        )}
      </g>,
    );
    if (state === "yours") firstYours = false;
  }
  return <>{out}</>;
}

function Wheel({ x, y, r = 9 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={INK} />
      <circle cx={x} cy={y} r={r * 0.35} fill="#FFFFFF" />
    </g>
  );
}

function Body({ kind, mode, belly }: { kind: LoadKind; mode: Mode; belly: boolean }) {
  const c = COLOR[mode];
  switch (kind) {
    case "truck":
      return (
        <g strokeLinejoin="round">
          <path d="M0 128 L400 128" stroke={INK} strokeWidth="1" opacity="0.35" />
          <rect x="10" y="22" width="272" height="88" rx="3" fill="#FFFFFF" stroke={INK} strokeWidth="2" />
          <path d="M288 40 L350 40 L384 74 L384 110 L288 110 Z" fill="#FFFFFF" stroke={INK} strokeWidth="2" />
          <path d="M296 46 L346 46 L370 72 L296 72 Z" fill={c} opacity="0.35" stroke={INK} strokeWidth="1.2" />
          <rect x="10" y="110" width="374" height="6" fill={INK} />
          <Wheel x={44} y={124} r={11} /><Wheel x={68} y={124} r={11} /><Wheel x={92} y={124} r={11} />
          <Wheel x={322} y={124} r={11} /><Wheel x={356} y={124} r={11} />
        </g>
      );
    case "plane":
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <path d="M34 66 L14 12 L52 12 L96 56 Z" fill={c} stroke={INK} strokeWidth="2" />
          <path d="M10 78 C10 50 60 38 122 38 L300 38 C362 38 392 58 397 78 C392 98 362 114 300 114 L122 114 C60 114 10 106 10 78 Z" fill="#FFFFFF" stroke={INK} strokeWidth="2" />
          <path d="M170 106 L262 106 L218 146 L160 146 Z" fill={c} stroke={INK} strokeWidth="2" />
          <rect x="196" y="112" width="30" height="12" rx="6" fill="#FFFFFF" stroke={INK} strokeWidth="1.6" />
          <path d="M350 52 L384 60 L384 70 L346 70 Z" fill={c} opacity="0.4" stroke={INK} strokeWidth="1.4" />
          {belly && (
            <g fill={c} opacity="0.55">
              {Array.from({ length: 22 }).map((_, i) => <rect key={i} x={70 + i * 11} y={48} width="6" height="6" rx="2" />)}
            </g>
          )}
          <rect x="66" y="60" width="256" height="48" rx="4" fill="#F3F4F6" stroke={INK} strokeWidth="1.6" strokeDasharray="5 3" />
        </g>
      );
    case "wagon":
      return (
        <g strokeLinejoin="round">
          <path d="M0 136 L400 136" stroke={INK} strokeWidth="2.5" />
          <rect x="22" y="30" width="356" height="90" rx="3" fill="#FFFFFF" stroke={INK} strokeWidth="2" />
          <rect x="22" y="30" width="356" height="8" fill={c} opacity="0.5" />
          <rect x="22" y="120" width="356" height="6" fill={INK} />
          <rect x="4" y="112" width="18" height="6" fill={INK} /><rect x="378" y="112" width="18" height="6" fill={INK} />
          <Wheel x={70} y={128} r={9} /><Wheel x={96} y={128} r={9} /><Wheel x={304} y={128} r={9} /><Wheel x={330} y={128} r={9} />
        </g>
      );
    case "container":
      return (
        <g strokeLinejoin="round">
          <path d="M0 140 L400 140" stroke={INK} strokeWidth="2.5" />
          <rect x="10" y="122" width="380" height="8" fill={INK} />
          <rect x="20" y="26" width="360" height="96" rx="2" fill="#FFFFFF" stroke={INK} strokeWidth="2" />
          <rect x="20" y="26" width="360" height="8" fill={c} opacity="0.6" />
          {Array.from({ length: 29 }).map((_, i) => <path key={i} d={`M${32 + i * 12} 34 L${32 + i * 12} 120`} stroke="#E5E7EB" strokeWidth="1" />)}
          <rect x="20" y="26" width="10" height="96" fill={INK} opacity="0.85" /><rect x="370" y="26" width="10" height="96" fill={INK} opacity="0.85" />
          <Wheel x={60} y={140} r={7} /><Wheel x={340} y={140} r={7} />
        </g>
      );
    case "ship":
      return (
        <g strokeLinejoin="round">
          <path d="M8 112 L392 112 L368 138 L34 138 Z" fill={c} stroke={INK} strokeWidth="2" />
          <path d="M0 144 C30 138 50 150 80 144 C110 138 130 150 160 144 C190 138 210 150 240 144 C270 138 290 150 320 144 C350 138 370 150 400 144" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" />
          <rect x="310" y="26" width="58" height="86" fill="#FFFFFF" stroke={INK} strokeWidth="2" />
          <rect x="316" y="34" width="46" height="9" fill={c} opacity="0.4" />
          <rect x="316" y="48" width="46" height="9" fill={c} opacity="0.4" />
          <rect x="338" y="8" width="12" height="18" fill={INK} />
        </g>
      );
  }
}

function areaFor(kind: LoadKind): Area {
  switch (kind) {
    case "truck": return { x: 16, y: 28, w: 260, h: 76 };
    case "plane": return { x: 72, y: 66, w: 244, h: 36 };
    case "wagon": return { x: 30, y: 44, w: 340, h: 70 };
    case "container": return { x: 38, y: 40, w: 324, h: 76 };
    case "ship": return { x: 24, y: 28, w: 274, h: 80 };
  }
}

export function LoadView({
  mode,
  equipment = "",
  seed,
  total,
  free,
  yours,
  unit,
  size = "row",
  className = "",
}: {
  mode: Mode;
  equipment?: string;
  /** Any text that stays the same for this offer, for the invented references. */
  seed: string;
  total: number | null;
  free: number;
  yours: number;
  unit: "kg" | "slots";
  size?: "row" | "large";
  className?: string;
}) {
  const kind = loadKind(mode, equipment);
  const { cols, rows } = LOAD_CELLS[kind];
  const layout = loadLayout({ total, free, yours, cells: cols * rows });
  const text = size === "large";
  const perCell = layout.cap / (cols * rows);
  const label = `${LOAD_NAME[kind]}: ${layout.loadedPct}% loaded with your cargo. Your cargo takes ${layout.yoursCells} of ${cols * rows} positions, ${layout.freePct}% would stay free.`;

  return (
    <svg viewBox="0 0 400 156" className={className} role="img" aria-label={label} fill="none">
      <Body kind={kind} mode={mode} belly={equipment.toLowerCase().includes("belly")} />
      <Cells area={areaFor(kind)} cols={cols} rows={rows} layout={layout} mode={mode} seed={seed} text={text} kg={unit === "kg" ? perCell : 0} />
    </svg>
  );
}

/** The numbers that go with the picture: how full it is, what your cargo takes, what stays free. */
export function LoadFigures({ total, free, yours, mode, equipment = "", unit }: { total: number | null; free: number; yours: number; mode: Mode; equipment?: string; unit: "kg" | "slots" }) {
  const kind = loadKind(mode, equipment);
  const { cols, rows } = LOAD_CELLS[kind];
  const l = loadLayout({ total, free, yours, cells: cols * rows });
  return (
    <dl className="grid grid-cols-3 gap-3 text-sm">
      <div>
        <dt className="text-xs text-muted">Loaded with your cargo</dt>
        <dd className="condensed text-[28px] font-bold leading-none">{l.loadedPct}%</dd>
      </div>
      <div>
        <dt className="text-xs text-muted">Your cargo takes</dt>
        <dd className="condensed text-[28px] font-bold leading-none">{l.yoursPct}%</dd>
        <dd className="text-xs text-muted">{l.yoursCells} of {cols * rows} positions</dd>
      </div>
      <div>
        <dt className="text-xs text-muted">Stays free</dt>
        <dd className="condensed text-[28px] font-bold leading-none">{l.freePct}%</dd>
        <dd className="text-xs text-muted">{unit === "kg" ? "by weight" : "by vehicle slots"}</dd>
      </div>
    </dl>
  );
}

export function LoadLegend({ mode }: { mode: Mode }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
      <li className="flex items-center gap-1.5"><span aria-hidden className="h-3 w-3 rounded-sm border border-[#9CA3AF] bg-[#D3D9E2]" />Booked by others</li>
      <li className="flex items-center gap-1.5"><span aria-hidden className="h-3 w-3 rounded-sm border border-ink" style={{ background: COLOR[mode] }} />Your cargo</li>
      <li className="flex items-center gap-1.5"><span aria-hidden className="h-3 w-3 rounded-sm border border-dashed border-[#B6BFCC] bg-white" />Free</li>
    </ul>
  );
}
