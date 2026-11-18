import type { CSSProperties } from "react";

/**
 * Flat side-view vehicles, all facing right, drawn in code. No logos, no names: they are generic on purpose.
 * Used by the race, the shipment board and the scroll story.
 */
type P = { className?: string; style?: CSSProperties };

const INK = "#0F172A";
const STEEL = "#334155";
const GLASS = "#BFDBFE";

function Wheel({ x, y, r = 10 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={INK} />
      <circle cx={x} cy={y} r={r * 0.55} fill="#CBD5E1" />
      <circle cx={x} cy={y} r={r * 0.2} fill={INK} />
    </g>
  );
}

export function TruckArt({ className, style, color = "#2563EB" }: P & { color?: string }) {
  return (
    <svg viewBox="0 0 290 96" className={className} style={style} aria-hidden fill="none">
      <ellipse cx="146" cy="91" rx="136" ry="3.5" fill="#0F172A" opacity="0.14" />
      <rect x="6" y="10" width="198" height="60" rx="4" fill="#F8FAFC" />
      <rect x="6" y="58" width="198" height="12" fill="#CBD5E1" />
      <rect x="6" y="10" width="198" height="5" rx="2" fill="#E2E8F0" />
      <rect x="6" y="36" width="198" height="7" fill={color} opacity="0.9" />
      {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={26 + i * 20} y="15" width="1.4" height="43" fill="#E2E8F0" />)}
      <rect x="6" y="70" width="254" height="6" rx="2" fill={STEEL} />
      <path d="M208 70 V32 Q208 26 214 26 H246 Q253 26 257 32 L273 54 Q276 58 276 62 V70 Z" fill={color} />
      <path d="M216 33 H245 L260 52 H216 Z" fill={GLASS} />
      <path d="M216 33 H232 L226 52 H216 Z" fill="#fff" opacity="0.35" />
      <rect x="266" y="58" width="12" height="12" rx="2" fill={STEEL} />
      <rect x="270" y="52" width="6" height="5" rx="1" fill="#FDE68A" />
      <rect x="203" y="12" width="4" height="30" rx="1" fill="#94A3B8" />
      <Wheel x={40} y={78} r={11} /><Wheel x={68} y={78} r={11} /><Wheel x={96} y={78} r={11} />
      <Wheel x={226} y={78} r={11} /><Wheel x={254} y={78} r={11} />
    </svg>
  );
}

const BOX = ["#F59E0B", "#3B82F6", "#10B981", "#EF4444", "#64748B", "#8B5CF6", "#EAB308", "#14B8A6"];

function Box({ x, y, w, h, i, dim = false }: { x: number; y: number; w: number; h: number; i: number; dim?: boolean }) {
  const col = BOX[i % BOX.length];
  return (
    <g opacity={dim ? 0.55 : 1}>
      <rect x={x} y={y} width={w} height={h} rx="1.5" fill={col} />
      <rect x={x} y={y} width={w} height={h * 0.18} rx="1.5" fill="#fff" opacity="0.22" />
      {Array.from({ length: Math.floor(w / 5) }).map((_, k) => <rect key={k} x={x + 3 + k * 5} y={y + h * 0.22} width="1" height={h * 0.7} fill="#000" opacity="0.12" />)}
    </g>
  );
}

export function TrainArt({ className, style, color = "#0F766E" }: P & { color?: string }) {
  return (
    <svg viewBox="0 0 540 92" className={className} style={style} aria-hidden fill="none">
      <path d="M0 87 H540" stroke="#94A3B8" strokeWidth="2.5" />
      {[0, 1, 2].map((n) => {
        const x = 6 + n * 118;
        return (
          <g key={n}>
            <rect x={x} y="64" width="112" height="7" rx="2" fill={STEEL} />
            <Box x={x + 4} y={24} w={50} h={40} i={n * 2} />
            <Box x={x + 58} y={24} w={50} h={40} i={n * 2 + 1} />
            <Wheel x={x + 20} y={78} r={7} /><Wheel x={x + 36} y={78} r={7} />
            <Wheel x={x + 76} y={78} r={7} /><Wheel x={x + 92} y={78} r={7} />
            <rect x={x + 108} y="68" width="14" height="3" fill={STEEL} />
          </g>
        );
      })}
      <path d="M368 71 V36 Q368 29 375 29 H468 Q479 29 486 38 L506 60 Q510 64 510 68 V71 Z" fill={color} />
      <rect x="368" y="56" width="142" height="7" fill="#fff" opacity="0.9" />
      <path d="M440 37 H466 L480 52 H440 Z" fill={GLASS} />
      <rect x="378" y="36" width="14" height="14" rx="2" fill={GLASS} />
      <rect x="398" y="36" width="14" height="14" rx="2" fill={GLASS} />
      <rect x="500" y="60" width="12" height="6" rx="1" fill="#FDE68A" />
      <rect x="368" y="22" width="30" height="7" rx="2" fill={STEEL} />
      <Wheel x={392} y={79} r={7} /><Wheel x={416} y={79} r={7} /><Wheel x={460} y={79} r={7} /><Wheel x={484} y={79} r={7} />
    </svg>
  );
}

const STACKS = [3, 4, 4, 3, 4, 4, 4, 3, 3, 2, 2, 1];

export function ShipArt({ className, style, containers = true, color = "#6D28D9" }: P & { containers?: boolean; color?: string }) {
  return (
    <svg viewBox="0 0 470 132" className={className} style={style} aria-hidden fill="none">
      {/* hull */}
      <path d="M8 72 H452 L428 112 Q423 120 414 120 H62 Q51 120 45 111 Z" fill="#1E3A5F" />
      <path d="M26 98 H440 L428 112 Q423 120 414 120 H62 Q51 120 45 111 Z" fill={color} />
      <rect x="8" y="72" width="444" height="5" fill="#F8FAFC" opacity="0.9" />
      {/* bridge */}
      <rect x="34" y="30" width="46" height="42" fill="#F8FAFC" />
      <rect x="30" y="24" width="54" height="8" rx="2" fill="#E2E8F0" />
      {[0, 1, 2].map((r) => Array.from({ length: 4 }).map((_, c) => <rect key={`${r}${c}`} x={40 + c * 10} y={38 + r * 10} width="6" height="5" rx="1" fill={GLASS} />))}
      <rect x="52" y="10" width="14" height="16" rx="2" fill={color} />
      <rect x="57" y="2" width="4" height="10" fill={STEEL} />
      {/* deck containers */}
      {containers && STACKS.map((n, c) =>
        Array.from({ length: n }).map((_, l) => <Box key={`${c}-${l}`} x={96 + c * 28} y={72 - (l + 1) * 14} w={26} h={13} i={c + l * 3} />),
      )}
      {/* bow */}
      <path d="M452 72 L446 60 L440 72" stroke={STEEL} strokeWidth="2" />
      {/* waves */}
      <path d="M0 122 q11 -7 22 0 t 44 0 t 44 0 t 44 0 t 44 0 t 44 0 t 44 0 t 44 0 t 44 0 t 44 0 t 44 0" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function PlaneArt({ className, style, color = "#1D4ED8" }: P & { color?: string }) {
  return (
    <svg viewBox="0 0 420 130" className={className} style={style} aria-hidden fill="none">
      {/* far wing */}
      <path d="M196 60 L168 30 H196 L250 60 Z" fill="#94A3B8" />
      {/* tail */}
      <path d="M44 52 L20 8 H54 L102 52 Z" fill={color} />
      <path d="M44 62 L8 52 H34 L84 62 Z" fill="#CBD5E1" />
      {/* fuselage */}
      <path d="M24 64 Q24 46 58 44 H334 Q384 44 406 64 Q384 82 334 84 H58 Q24 82 24 64 Z" fill="#F8FAFC" />
      <path d="M30 70 Q60 80 120 80 H340 Q380 80 402 68 Q384 86 334 86 H58 Q30 84 30 70 Z" fill="#CBD5E1" />
      <path d="M356 50 Q392 52 406 64 H356 Z" fill={GLASS} opacity="0.9" />
      {Array.from({ length: 22 }).map((_, i) => <circle key={i} cx={96 + i * 11} cy={58} r="2.2" fill="#94A3B8" />)}
      <rect x="64" y="52" width="9" height="20" rx="2" fill="none" stroke="#CBD5E1" strokeWidth="1.5" />
      <rect x="320" y="52" width="9" height="20" rx="2" fill="none" stroke="#CBD5E1" strokeWidth="1.5" />
      {/* near wing and engine */}
      <path d="M176 70 L118 118 H162 L268 74 Z" fill="#E2E8F0" />
      <path d="M118 118 H162 L172 110 H126 Z" fill={color} opacity="0.9" />
      <ellipse cx="214" cy="92" rx="26" ry="10" fill="#94A3B8" />
      <ellipse cx="236" cy="92" rx="6" ry="9" fill={color} />
    </svg>
  );
}

export const VEHICLE_ART = { ROAD: TruckArt, RAIL: TrainArt, SEA: ShipArt, AIR: PlaneArt } as const;
