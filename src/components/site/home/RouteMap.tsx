import { MODE_HEX_BRIGHT, type Mode } from "@/lib/constants";
import { cityByCode, CITIES } from "@/lib/places";
import { MOVERS } from "./heroLanes";

/**
 * The network the demo covers: every city AeroMatch knows, the pilot lanes from Tashkent in orange, and traffic
 * moving on the lanes (planes, ships, trucks and trains, each only where that mode really runs).
 * The motion is SVG animation: the site's Pause motion button stops it, and with reduced motion it is not drawn.
 * Decorative; the page says the same in words.
 */
const W = 1000;
const H = 440;
const LON0 = -128;
const LON1 = 135;
const LAT0 = 62;
const LAT1 = 12;
const px = (lon: number) => ((lon - LON0) / (LON1 - LON0)) * W;
const py = (lat: number) => ((LAT0 - lat) / (LAT0 - LAT1)) * H;

const PILOT = ["IST", "DXB", "ALA"];
const OTHER: [string, string][] = [
  ["IST", "RTM"], ["DXB", "PVG"], ["HAM", "JFK"], ["PEK", "ICN"], ["CAN", "PVG"], ["DEL", "DXB"], ["SVO", "WAW"],
  ["LAX", "JFK"], ["DOH", "CAI"], ["RUH", "DXB"], ["TBS", "GYD"], ["ASB", "IKA"], ["NQZ", "SVO"], ["FRU", "ALA"],
  ["DYU", "TAS"], ["SKD", "TAS"], ["TAS", "SVO"], ["TAS", "PEK"], ["TAS", "DEL"], ["TAS", "FRA"], ["ESB", "IST"], ["HAM", "RTM"],
];
const LABELS = ["TAS", "ALA", "DXB", "PVG", "DEL"];
const HUBS = ["IST", "DXB", "PVG", "RTM", "JFK", "ALA", "FRA", "DEL", "LAX", "SVO"];
/** How high a lane bends: flights arc high, surface lanes stay low. */
const BEND: Record<Mode, number> = { AIR: 0.22, SEA: 0.07, RAIL: 0.09, ROAD: 0.09 };

function arc(a: string, b: string, bend = 0.22): string | null {
  const p = cityByCode(a);
  const q = cityByCode(b);
  if (!p || !q) return null;
  const [x1, y1, x2, y2] = [px(p.lon), py(p.lat), px(q.lon), py(q.lat)];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.hypot(dx, dy) || 1;
  // bend towards the top of the map, more for longer lanes
  const side = dx >= 0 ? 1 : -1;
  const cx = (x1 + x2) / 2 + (dy / d) * d * bend * side;
  const cy = (y1 + y2) / 2 - (Math.abs(dx) / d) * d * bend;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

/** Vehicles seen from above, pointing right, so following the lane never turns one upside down. */
function Glyph({ mode }: { mode: Mode }) {
  const c = MODE_HEX_BRIGHT[mode];
  switch (mode) {
    case "AIR":
      return (
        <g>
          <path d="M8 0 C8 -1 7 -1.4 6 -1.4 L-5 -1.4 L-8 -0.7 L-8 0.7 L-5 1.4 L6 1.4 C7 1.4 8 1 8 0 Z" fill="#F4F4F2" />
          <path d="M2.5 -1.2 L-1 -8 L-2.8 -8 L-1.2 -1.2 Z M2.5 1.2 L-1 8 L-2.8 8 L-1.2 1.2 Z" fill="#F4F4F2" />
          <path d="M-5.5 -1.1 L-7.6 -4 L-8.6 -4 L-7.2 -1.1 Z M-5.5 1.1 L-7.6 4 L-8.6 4 L-7.2 1.1 Z" fill={c} />
        </g>
      );
    case "SEA":
      return (
        <g>
          <path d="M10 0 L6 -3 L-9 -3 L-9 3 L6 3 Z" fill="#F4F4F2" />
          <rect x="-7" y="-2" width="3" height="4" fill="#FF5B1F" />
          <rect x="-3.6" y="-2" width="3" height="4" fill={c} />
          <rect x="-0.2" y="-2" width="3" height="4" fill="#E2B04F" />
          <rect x="3.2" y="-2" width="2.2" height="4" fill="#6FD79A" />
        </g>
      );
    case "ROAD":
      return (
        <g>
          <rect x="-8" y="-2.4" width="11" height="4.8" rx="0.6" fill="#F4F4F2" />
          <rect x="3.8" y="-2.1" width="3.8" height="4.2" rx="1" fill={c} />
        </g>
      );
    case "RAIL":
      return (
        <g>
          {[-13, -6.5, 0].map((x) => <rect key={x} x={x} y="-2" width="5.8" height="4" rx="0.5" fill="#F4F4F2" />)}
          <rect x="6.5" y="-2.2" width="5" height="4.4" rx="1.4" fill={c} />
        </g>
      );
  }
}

export function RouteMap({ className = "" }: { className?: string }) {
  const tas = cityByCode("TAS")!;
  const lanes = MOVERS.map((m, i) => ({ ...m, id: `lane-${i}`, d: arc(m.from, m.to, BEND[m.mode]) }));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden fill="none" preserveAspectRatio="xMidYMid meet" data-motion="">
      {OTHER.map(([a, b], i) => {
        const d = arc(a, b);
        return d ? <path key={`${a}${b}`} id={`other-${i}`} d={d} pathLength={1} className="route-arc" style={{ ["--d" as string]: `${0.3 + i * 0.02}s` }} stroke="rgba(255,255,255,0.14)" strokeWidth="1" /> : null;
      })}
      {lanes.map((l) =>
        l.d ? (
          <path
            key={l.id}
            id={l.id}
            d={l.d}
            pathLength={1}
            className="route-arc"
            style={{ ["--d" as string]: "0.6s" }}
            stroke={l.mode === "AIR" ? "rgba(255,255,255,0.2)" : MODE_HEX_BRIGHT[l.mode]}
            strokeOpacity={l.mode === "AIR" ? 1 : 0.4}
            strokeWidth={l.mode === "AIR" ? 1 : 1.4}
          />
        ) : null,
      )}
      {PILOT.map((b, i) => {
        const d = arc("TAS", b);
        return d ? <path key={b} d={d} pathLength={1} className="route-arc" style={{ ["--d" as string]: `${0.9 + i * 0.25}s` }} stroke="#FF5B1F" strokeWidth="2" /> : null;
      })}
      {CITIES.map((c, i) => (
        <circle key={c.code} cx={px(c.lon)} cy={py(c.lat)} r={c.code === "TAS" ? 5 : 2.4} className="route-node" style={{ ["--d" as string]: `${0.1 + i * 0.015}s` }} fill={c.code === "TAS" ? "#FF5B1F" : "rgba(255,255,255,0.75)"} />
      ))}
      {LABELS.map((code) => {
        const c = cityByCode(code)!;
        return (
          <text key={code} x={px(c.lon) + 8} y={py(c.lat) - 8} fontSize="11" fontWeight="600" letterSpacing="0.06em" className="route-node" style={{ ["--d" as string]: "1.2s" }} fill={code === "TAS" ? "#FF5B1F" : "rgba(255,255,255,0.55)"}>
            {code}
          </text>
        );
      })}

      {/* Everything below moves without stopping. Hidden with reduced motion; the Pause motion button stops it. */}
      <g className="route-movers">
        {[0, 1.2].map((begin) => (
          <circle key={begin} cx={px(tas.lon)} cy={py(tas.lat)} r="6" stroke="#FF5B1F" strokeWidth="1.5">
            <animate attributeName="r" values="6;26" dur="2.4s" begin={`${begin}s`} repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0.8;0" dur="2.4s" begin={`${begin}s`} repeatCount="indefinite" />
          </circle>
        ))}
        {HUBS.map((code, i) => {
          const c = cityByCode(code)!;
          return (
            <circle key={code} cx={px(c.lon)} cy={py(c.lat)} r="3" stroke="#F4F4F2" strokeWidth="1">
              <animate attributeName="r" values="3;12" dur="3s" begin={`${((i * 0.37) % 3).toFixed(2)}s`} repeatCount="indefinite" />
              <animate attributeName="stroke-opacity" values="0.6;0" dur="3s" begin={`${((i * 0.37) % 3).toFixed(2)}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
        {/* sparks running along the pilot lanes and the faint lanes */}
        {PILOT.map((b, i) => {
          const d = arc("TAS", b);
          return d ? (
            <circle key={`spark-${b}`} r="2.6" fill="#FF8A5C">
              <animateMotion dur={`${3.2 + i * 0.6}s`} begin={`${i * 0.8}s`} repeatCount="indefinite" path={d} />
            </circle>
          ) : null;
        })}
        {OTHER.map(([a, b], i) =>
          i % 2 === 0 ? (
            <circle key={`dot-${a}${b}`} r="1.8" fill="#F4F4F2" opacity="0.8">
              <animateMotion dur={`${5 + (i % 4)}s`} begin={`${((i * 0.7) % 5).toFixed(1)}s`} repeatCount="indefinite">
                <mpath href={`#other-${i}`} />
              </animateMotion>
            </circle>
          ) : null,
        )}
        {lanes.map((l) =>
          l.d ? (
            <g key={`mover-${l.id}`} opacity="0">
              <Glyph mode={l.mode} />
              <animateMotion dur={`${l.seconds}s`} begin={`${l.delay}s`} repeatCount="indefinite" rotate="auto">
                <mpath href={`#${l.id}`} />
              </animateMotion>
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.92;1" dur={`${l.seconds}s`} begin={`${l.delay}s`} repeatCount="indefinite" />
            </g>
          ) : null,
        )}
      </g>
    </svg>
  );
}
