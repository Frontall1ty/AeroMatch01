import type { Mode } from "@/lib/constants";

/**
 * Simple side-view drawings of the vehicle that carries the cargo: aircraft, ship, wagon, truck.
 * They are illustrations, not photos of a real fleet. The body takes the mode color.
 */
const COLOR: Record<Mode, string> = { AIR: "#1D4ED8", SEA: "#6D28D9", RAIL: "#0F766E", ROAD: "#B45309" };
const INK = "#111827";

type Kind = "plane" | "plane-belly" | "ship" | "ship-roro" | "wagon" | "wagon-cars" | "truck" | "truck-cars";

export function artKind(mode: Mode, equipment: string, vehicles: boolean): Kind {
  const e = equipment.toLowerCase();
  if (mode === "AIR") return e.includes("belly") ? "plane-belly" : "plane";
  if (mode === "SEA") return vehicles || e.includes("ro-ro") ? "ship-roro" : "ship";
  if (mode === "RAIL") return vehicles || e.includes("car") ? "wagon-cars" : "wagon";
  return vehicles || e.includes("car carrier") ? "truck-cars" : "truck";
}

const NAME: Record<Kind, string> = {
  plane: "Cargo aircraft",
  "plane-belly": "Passenger aircraft, cargo in the belly",
  ship: "Container ship",
  "ship-roro": "Roll-on roll-off vessel",
  wagon: "Rail wagon",
  "wagon-cars": "Car-carrier wagon",
  truck: "Truck with trailer",
  "truck-cars": "Car carrier truck",
};
export const artName = (mode: Mode, equipment: string, vehicles: boolean) => NAME[artKind(mode, equipment, vehicles)];

function Car({ x, y, fill }: { x: number; y: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 9 L2 4 L7 1.5 L14 1.5 L18 4 L21 5 L21 9 Z" fill={fill} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
      <circle cx="5" cy="9.5" r="2" fill={INK} />
      <circle cx="16" cy="9.5" r="2" fill={INK} />
    </g>
  );
}

function Containers({ x, y, cols, rows, size = 11, fill }: { x: number; y: number; cols: number; rows: number; size?: number; fill: string[] }) {
  const out = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      out.push(<rect key={`${r}-${c}`} x={x + c * (size + 1)} y={y - (r + 1) * (size / 2 + 1)} width={size} height={size / 2} fill={fill[(r + c) % fill.length]} stroke={INK} strokeWidth="0.8" />);
  return <>{out}</>;
}

export function VehicleArt({
  mode,
  equipment = "",
  vehicles = false,
  className = "h-12 w-28",
  label = true,
}: {
  mode: Mode;
  equipment?: string;
  vehicles?: boolean;
  className?: string;
  /** Adds an accessible name. Leave true unless the name is written next to it. */
  label?: boolean;
}) {
  const kind = artKind(mode, equipment, vehicles);
  const c = COLOR[mode];
  const soft = c + "55";
  return (
    <svg
      viewBox="0 0 160 60"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label ? NAME[kind] : undefined}
      aria-hidden={label ? undefined : true}
      fill="none"
    >
      {(kind === "plane" || kind === "plane-belly") && (
        <g strokeLinejoin="round" strokeLinecap="round">
          {/* tail fin, fuselage, nose */}
          <path d="M18 30 L10 10 L22 10 L36 28 Z" fill={c} stroke={INK} strokeWidth="1.5" />
          <path d="M8 31 C8 24 20 22 40 22 L128 22 C146 22 155 28 156 31 C155 35 146 40 128 40 L40 40 C20 40 8 38 8 31 Z" fill="#fff" stroke={INK} strokeWidth="1.5" />
          <path d="M8 31 C8 38 20 40 40 40 L128 40 C146 40 155 35 156 31 L8 31 Z" fill={soft} />
          {/* wing and engine */}
          <path d="M70 38 L104 38 L84 56 L66 56 Z" fill={c} stroke={INK} strokeWidth="1.5" />
          <rect x="82" y="40" width="14" height="7" rx="3.5" fill="#fff" stroke={INK} strokeWidth="1.2" />
          {kind === "plane" ? (
            <path d="M138 24 L148 24 L150 30 L138 30 Z" fill={c} stroke={INK} strokeWidth="1" />
          ) : (
            <g fill={c}>
              {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={46 + i * 7.5} y={26} width="4" height="3.5" rx="1" />)}
              <path d="M140 25 L148 25 L150 29 L140 29 Z" />
            </g>
          )}
          {kind === "plane" && <path d="M40 24 L128 24" stroke={INK} strokeWidth="1" strokeDasharray="3 3" />}
        </g>
      )}

      {(kind === "ship" || kind === "ship-roro") && (
        <g strokeLinejoin="round">
          <path d="M6 38 L154 38 L142 54 L20 54 Z" fill={c} stroke={INK} strokeWidth="1.5" />
          <path d="M6 38 L154 38 L152 41 L8 41 Z" fill={INK} opacity="0.25" />
          <path d="M0 57 C20 53 30 59 50 56 C70 53 80 59 100 56 C120 53 130 59 160 55" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
          {kind === "ship" ? (
            <>
              <Containers x={14} y={38} cols={8} rows={3} size={12} fill={["#F59E0B", "#0EA5E9", "#EF4444", "#10B981"]} />
              <rect x="118" y="10" width="26" height="28" fill="#fff" stroke={INK} strokeWidth="1.5" />
              <rect x="122" y="15" width="18" height="5" fill={soft} />
              <rect x="128" y="3" width="6" height="7" fill={INK} />
            </>
          ) : (
            <>
              <rect x="14" y="14" width="98" height="24" fill="#fff" stroke={INK} strokeWidth="1.5" />
              {[0, 1, 2, 3].map((i) => <Car key={i} x={18 + i * 23} y={26} fill={["#F59E0B", "#0EA5E9", "#EF4444", "#10B981"][i]} />)}
              <rect x="118" y="14" width="26" height="24" fill="#fff" stroke={INK} strokeWidth="1.5" />
              <rect x="122" y="18" width="18" height="5" fill={soft} />
            </>
          )}
        </g>
      )}

      {(kind === "wagon" || kind === "wagon-cars") && (
        <g strokeLinejoin="round">
          <path d="M0 52 L160 52" stroke={INK} strokeWidth="2" />
          <path d="M6 50 L154 50" stroke={INK} strokeWidth="1" strokeDasharray="2 4" />
          <rect x="14" y="38" width="132" height="6" fill={INK} />
          {kind === "wagon" ? (
            <>
              <rect x="18" y="12" width="60" height="26" fill={c} stroke={INK} strokeWidth="1.5" />
              <rect x="82" y="12" width="60" height="26" fill={soft} stroke={INK} strokeWidth="1.5" />
              {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${24 + i * 10} 14 L${24 + i * 10} 36`} stroke="#fff" strokeWidth="1.2" />)}
            </>
          ) : (
            <>
              <rect x="18" y="10" width="124" height="28" fill="#fff" stroke={INK} strokeWidth="1.5" />
              {[0, 1, 2, 3, 4].map((i) => <Car key={i} x={22 + i * 23} y={26} fill={["#F59E0B", "#0EA5E9", "#EF4444", "#10B981", "#8B5CF6"][i]} />)}
              <path d="M18 18 L142 18" stroke={c} strokeWidth="3" />
            </>
          )}
          {[30, 44, 116, 130].map((x) => <circle key={x} cx={x} cy={47} r="5" fill="#fff" stroke={INK} strokeWidth="1.5" />)}
        </g>
      )}

      {(kind === "truck" || kind === "truck-cars") && (
        <g strokeLinejoin="round">
          <path d="M0 54 L160 54" stroke={INK} strokeWidth="1" opacity="0.4" />
          {/* cab */}
          <path d="M120 22 L142 22 L154 34 L154 46 L120 46 Z" fill={c} stroke={INK} strokeWidth="1.5" />
          <path d="M126 26 L140 26 L148 34 L126 34 Z" fill="#fff" stroke={INK} strokeWidth="1" />
          {/* trailer */}
          <rect x="4" y="12" width="112" height="34" fill="#fff" stroke={INK} strokeWidth="1.5" />
          {kind === "truck" ? (
            <>
              <rect x="4" y="12" width="112" height="9" fill={soft} />
              <path d="M30 12 L30 46 M58 12 L58 46 M86 12 L86 46" stroke={INK} strokeWidth="0.8" opacity="0.5" />
            </>
          ) : (
            <>
              {[0, 1, 2].map((i) => <Car key={`a${i}`} x={10 + i * 34} y={20} fill={["#F59E0B", "#0EA5E9", "#EF4444"][i]} />)}
              <path d="M4 30 L116 30" stroke={INK} strokeWidth="1" />
              {[0, 1, 2].map((i) => <Car key={`b${i}`} x={10 + i * 34} y={36} fill={["#10B981", "#8B5CF6", "#F59E0B"][i]} />)}
            </>
          )}
          <rect x="4" y="46" width="150" height="4" fill={INK} />
          {[24, 38, 52, 106, 134].map((x) => (
            <g key={x}>
              <circle cx={x} cy={52} r="6" fill={INK} />
              <circle cx={x} cy={52} r="2.2" fill="#fff" />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
