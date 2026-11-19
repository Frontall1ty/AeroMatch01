import { useId, type CSSProperties } from "react";
import { MODE_HEX } from "@/lib/constants";

/**
 * Side-view vehicles, all facing right, drawn in code with soft shading so they stay sharp at any size.
 * No logos, no names: they are generic on purpose. Used by the race, the board, the scroll story and the load view.
 */
type P = { className?: string; style?: CSSProperties };

const STEEL = "#334155";

/** Unique ids for the gradients, so several vehicles on one page do not clash. */
function useIds() {
  return useId().replace(/[^a-zA-Z0-9]/g, "");
}

function Grad({ id, from, to, mid, midAt = 0.5, dir = "v" }: { id: string; from: string; to: string; mid?: string; midAt?: number; dir?: "v" | "h" }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={dir === "h" ? 1 : 0} y2={dir === "v" ? 1 : 0}>
      <stop offset="0" stopColor={from} />
      {mid && <stop offset={midAt} stopColor={mid} />}
      <stop offset="1" stopColor={to} />
    </linearGradient>
  );
}

function Wheel({ x, y, r = 10 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#0B1220" />
      <circle cx={x} cy={y} r={r * 0.9} fill="none" stroke="#1F2937" strokeWidth={r * 0.1} />
      <circle cx={x} cy={y} r={r * 0.58} fill="#CBD5E1" />
      <circle cx={x} cy={y} r={r * 0.5} fill="#E2E8F0" />
      <circle cx={x} cy={y} r={r * 0.22} fill="#64748B" />
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return <circle key={i} cx={x + Math.cos(a) * r * 0.36} cy={y + Math.sin(a) * r * 0.36} r={r * 0.05} fill="#475569" />;
      })}
    </g>
  );
}

export function TruckArt({ className, style, color = "#2F55E0" }: P & { color?: string }) {
  const id = useIds();
  return (
    <svg viewBox="0 0 300 100" className={className} style={style} aria-hidden fill="none">
      <defs>
        <Grad id={`${id}a`} from="#FFFFFF" mid="#EEF2F6" midAt={0.55} to="#CBD5E1" />
        <Grad id={`${id}b`} from="#94A3B8" to="#475569" />
        <Grad id={`${id}c`} from="#FFFFFF" to="#000000" />
        <Grad id={`${id}g`} from="#DCEBFF" to="#6FA3DE" />
        <Grad id={`${id}t`} from="#E2E8F0" mid="#94A3B8" midAt={0.5} to="#64748B" />
        <linearGradient id={`${id}d`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
      </defs>
      <ellipse cx="150" cy="95" rx="142" ry="3.5" fill="#0F172A" opacity="0.18" />
      {/* trailer */}
      <rect x="8" y="8" width="198" height="58" rx="3" fill={`url(#${id}a)`} />
      {Array.from({ length: 13 }).map((_, i) => <rect key={i} x={20 + i * 14} y="12" width="1.2" height="49" fill="#94A3B8" opacity="0.28" />)}
      <rect x="8" y="8" width="198" height="4" rx="2" fill="#fff" opacity="0.9" />
      <rect x="8" y="34" width="198" height="5" fill={color} opacity="0.92" />
      <rect x="8" y="34" width="198" height="1.2" fill="#fff" opacity="0.5" />
      <rect x="199" y="8" width="7" height="58" rx="2" fill="#B6C0CE" />
      <rect x="8" y="62" width="198" height="9" fill={`url(#${id}b)`} />
      <rect x="8" y="8" width="198" height="58" rx="3" fill={`url(#${id}d)`} opacity="0.45" />
      {/* chassis, tank and landing legs */}
      <rect x="8" y="71" width="262" height="5" rx="1.5" fill="#1E293B" />
      <rect x="216" y="70" width="32" height="12" rx="6" fill={`url(#${id}t)`} />
      <rect x="222" y="74" width="20" height="1.2" fill="#fff" opacity="0.5" />
      {/* cab */}
      <rect x="208" y="15" width="3" height="30" rx="1.2" fill="#94A3B8" />
      <path d="M212 71 V31 Q212 24 219 24 H250 Q258 24 263 31 L285 56 Q289 61 289 66 V71 Z" fill={color} />
      <path d="M212 71 V31 Q212 24 219 24 H250 Q258 24 263 31 L285 56 Q289 61 289 66 V71 Z" fill={`url(#${id}d)`} />
      <path d="M208 20 H237 L241 27 H208 Z" fill={color} />
      <path d="M208 20 H237 L241 27 H208 Z" fill="#000" opacity="0.18" />
      <path d="M221 31 H250 L269 55 H221 Z" fill={`url(#${id}g)`} />
      <path d="M221 31 H236 L228 55 H221 Z" fill="#fff" opacity="0.35" />
      <path d="M221 31 V70" stroke="#000" strokeOpacity="0.22" strokeWidth="1" />
      <rect x="224" y="58" width="9" height="2" rx="1" fill="#000" opacity="0.3" />
      <rect x="268" y="35" width="3" height="11" rx="1.2" fill="#1E293B" />
      <rect x="281" y="58" width="7" height="10" rx="1.5" fill="#1E293B" />
      <rect x="284" y="55" width="5" height="3.5" rx="1" fill="#FEF3C7" />
      <rect x="279" y="66" width="13" height="6" rx="2" fill="#475569" />
      <rect x="247" y="71" width="15" height="4" rx="1" fill="#94A3B8" />
      {/* wheels */}
      <path d="M219 81 A13 13 0 0 1 245 81" stroke="#1E293B" strokeWidth="3" />
      <path d="M249 81 A13 13 0 0 1 275 81" stroke="#1E293B" strokeWidth="3" />
      <Wheel x={42} y={81} r={11.5} /><Wheel x={70} y={81} r={11.5} /><Wheel x={98} y={81} r={11.5} />
      <Wheel x={232} y={81} r={12} /><Wheel x={262} y={81} r={12} />
    </svg>
  );
}

const BOX = ["#E8A12B", "#3F78D6", "#2FA37A", "#D65A4E", "#6B7A90", "#8B6AD6", "#D9B93A", "#2BA3A3"];

function Box({ x, y, w, h, i }: { x: number; y: number; w: number; h: number; i: number }) {
  const col = BOX[i % BOX.length];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="1.5" fill={col} />
      <rect x={x} y={y} width={w} height={h * 0.2} rx="1.5" fill="#fff" opacity="0.28" />
      <rect x={x} y={y + h * 0.82} width={w} height={h * 0.18} rx="1" fill="#000" opacity="0.18" />
      {Array.from({ length: Math.floor(w / 4.5) }).map((_, k) => <rect key={k} x={x + 2.5 + k * 4.5} y={y + h * 0.22} width="1" height={h * 0.58} fill="#000" opacity="0.13" />)}
    </g>
  );
}

export function TrainArt({ className, style, color = MODE_HEX.RAIL }: P & { color?: string }) {
  const id = useIds();
  return (
    <svg viewBox="0 0 540 92" className={className} style={style} aria-hidden fill="none">
      <defs>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </linearGradient>
        <Grad id={`${id}g`} from="#DCEBFF" to="#6FA3DE" />
      </defs>
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
      <path d="M368 71 V36 Q368 29 375 29 H468 Q479 29 486 38 L506 60 Q510 64 510 68 V71 Z" fill={`url(#${id}l)`} />
      <rect x="368" y="56" width="142" height="6" fill="#fff" opacity="0.92" />
      <path d="M440 37 H466 L480 52 H440 Z" fill={`url(#${id}g)`} />
      <rect x="378" y="36" width="14" height="14" rx="2" fill={`url(#${id}g)`} />
      <rect x="398" y="36" width="14" height="14" rx="2" fill={`url(#${id}g)`} />
      <rect x="500" y="60" width="12" height="6" rx="1" fill="#FEF3C7" />
      <rect x="368" y="22" width="30" height="7" rx="2" fill={STEEL} />
      <Wheel x={392} y={79} r={7} /><Wheel x={416} y={79} r={7} /><Wheel x={460} y={79} r={7} /><Wheel x={484} y={79} r={7} />
    </svg>
  );
}

const STACKS = [3, 4, 4, 3, 4, 4, 4, 3, 3, 2, 2, 1];

export function ShipArt({ className, style, containers = true, color = MODE_HEX.SEA }: P & { containers?: boolean; color?: string }) {
  const id = useIds();
  return (
    <svg viewBox="0 0 470 132" className={className} style={style} aria-hidden fill="none">
      <defs>
        <Grad id={`${id}h`} from="#2B4C78" to="#14304F" />
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#000" stopOpacity="0.25" />
        </linearGradient>
        <Grad id={`${id}g`} from="#DCEBFF" to="#6FA3DE" />
      </defs>
      <path d="M8 72 H452 L428 112 Q423 120 414 120 H62 Q51 120 45 111 Z" fill={`url(#${id}h)`} />
      <path d="M26 98 H440 L428 112 Q423 120 414 120 H62 Q51 120 45 111 Z" fill={color} />
      <path d="M26 98 H440 L428 112 Q423 120 414 120 H62 Q51 120 45 111 Z" fill={`url(#${id}w)`} />
      <rect x="8" y="72" width="444" height="5" fill="#F8FAFC" opacity="0.92" />
      <rect x="34" y="30" width="46" height="42" fill="#F1F5F9" />
      <rect x="34" y="30" width="46" height="42" fill={`url(#${id}w)`} opacity="0.5" />
      <rect x="30" y="24" width="54" height="8" rx="2" fill="#E2E8F0" />
      {[0, 1, 2].map((r) => Array.from({ length: 4 }).map((_, c) => <rect key={`${r}${c}`} x={40 + c * 10} y={38 + r * 10} width="6" height="5" rx="1" fill={`url(#${id}g)`} />))}
      <rect x="52" y="10" width="14" height="16" rx="2" fill={color} />
      <rect x="57" y="2" width="4" height="10" fill={STEEL} />
      {containers && STACKS.map((n, c) =>
        Array.from({ length: n }).map((_, l) => <Box key={`${c}-${l}`} x={96 + c * 28} y={72 - (l + 1) * 14} w={26} h={13} i={c + l * 3} />),
      )}
      <path d="M452 72 L446 60 L440 72" stroke={STEEL} strokeWidth="2" />
      <path d="M0 122 q11 -7 22 0 t 44 0 t 44 0 t 44 0 t 44 0 t 44 0 t 44 0 t 44 0 t 44 0 t 44 0 t 44 0" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** A twin-engine airliner seen from the side, nose to the right. */
export function PlaneArt({ className, style, color = MODE_HEX.AIR }: P & { color?: string }) {
  const id = useIds();
  return (
    <svg viewBox="0 0 600 190" className={className} style={style} aria-hidden fill="none">
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.45" stopColor="#F3F6FA" />
          <stop offset="0.8" stopColor="#D5DDE8" />
          <stop offset="1" stopColor="#B4C0D0" />
        </linearGradient>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3B7BF2" />
          <stop offset="1" stopColor={color} />
        </linearGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F1F5F9" />
          <stop offset="1" stopColor="#9AA8BA" />
        </linearGradient>
        <linearGradient id={`${id}e`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F8FAFC" />
          <stop offset="1" stopColor="#8D9BAF" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#31445F" />
          <stop offset="1" stopColor="#0F1B2D" />
        </linearGradient>
      </defs>
      {/* far wing and far tail plane */}
      <path d="M312 78 L262 38 L292 36 L372 74 Z" fill="#8A98AC" />
      <path d="M62 92 L26 76 L58 74 L108 90 Z" fill="#9AA8BA" />
      {/* tail fin */}
      <path d="M64 80 L28 12 H80 L158 74 Z" fill={`url(#${id}t)`} />
      <path d="M52 56 L38 28 H58 L84 56 Z" fill="#fff" opacity="0.18" />
      {/* fuselage */}
      <path d="M18 100 C18 84 40 74 74 72 L462 66 C530 64 580 84 586 100 C580 116 530 134 462 136 L74 130 C40 128 18 116 18 100 Z" fill={`url(#${id}f)`} />
      <path d="M22 106 C60 120 120 124 240 126 L462 128 C530 126 572 116 584 104" stroke="#9AA8BA" strokeWidth="1.2" opacity="0.55" />
      <path d="M26 110 C70 114 130 114 460 110 C520 108 560 104 580 102" stroke={color} strokeWidth="3.5" opacity="0.85" />
      {/* windows and doors */}
      {Array.from({ length: 27 }).map((_, i) => <rect key={i} x={116 + i * 12.5} y={86} width="5.5" height="7.5" rx="2.4" fill="#5B6B83" />)}
      <rect x="84" y="80" width="14" height="26" rx="5" stroke="#B4C0D0" strokeWidth="1.5" />
      <rect x="466" y="78" width="14" height="26" rx="5" stroke="#B4C0D0" strokeWidth="1.5" />
      <path d="M520 78 Q552 78 570 92 L520 92 Z" fill={`url(#${id}g)`} />
      <path d="M526 80 L540 80 L532 90 L526 90 Z" fill="#fff" opacity="0.25" />
      {/* near wing */}
      <path d="M262 112 L158 176 H210 L392 118 Z" fill={`url(#${id}w)`} />
      <path d="M158 176 H210 L222 170 H170 Z" fill={color} opacity="0.9" />
      <path d="M262 112 L392 118" stroke="#fff" strokeWidth="2" opacity="0.7" />
      {/* engine */}
      <rect x="306" y="124" width="12" height="20" fill="#9AA8BA" />
      <ellipse cx="330" cy="150" rx="46" ry="17" fill={`url(#${id}e)`} />
      <ellipse cx="372" cy="150" rx="9" ry="15" fill="#475569" />
      <ellipse cx="372" cy="150" rx="4.5" ry="8" fill="#1E293B" />
      <path d="M290 143 H350" stroke="#fff" strokeWidth="2" opacity="0.6" />
      <ellipse cx="290" cy="150" rx="8" ry="10" fill="#6B7A90" />
    </svg>
  );
}

export const VEHICLE_ART = { ROAD: TruckArt, RAIL: TrainArt, SEA: ShipArt, AIR: PlaneArt } as const;
