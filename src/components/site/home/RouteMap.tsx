import { cityByCode, CITIES } from "@/lib/places";

/**
 * The network the demo covers, drawn once: every city AeroMatch knows, the pilot lanes from Tashkent in orange,
 * and the other lanes as faint arcs. Decorative; the page says the same in words.
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
  ["IST", "RTM"], ["IST", "DXB"], ["DXB", "BOM"], ["DXB", "PVG"], ["PVG", "LAX"], ["RTM", "JFK"], ["HAM", "JFK"],
  ["FRA", "PVG"], ["ALA", "URC"], ["URC", "PEK"], ["PEK", "ICN"], ["CAN", "PVG"], ["KHI", "DXB"], ["DEL", "DXB"],
  ["CAI", "IST"], ["SVO", "WAW"], ["WAW", "HAM"], ["LHR", "JFK"], ["LAX", "JFK"], ["DOH", "CAI"], ["RUH", "DXB"],
  ["IKA", "IST"], ["TBS", "GYD"], ["ASB", "IKA"], ["NQZ", "SVO"], ["FRU", "ALA"], ["DYU", "TAS"], ["SKD", "TAS"],
  ["TAS", "SVO"], ["TAS", "PEK"], ["TAS", "DEL"], ["TAS", "FRA"], ["ESB", "IST"], ["HAM", "RTM"], ["DEL", "BOM"],
];
const LABELS = ["TAS", "IST", "DXB", "ALA", "PVG", "RTM", "SVO", "DEL"];

function arc(a: string, b: string): string | null {
  const p = cityByCode(a);
  const q = cityByCode(b);
  if (!p || !q) return null;
  const [x1, y1, x2, y2] = [px(p.lon), py(p.lat), px(q.lon), py(q.lat)];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.hypot(dx, dy);
  // bend upwards, more for longer lanes
  const cx = (x1 + x2) / 2 + (dy / d) * d * 0.22 * Math.sign(dx || 1);
  const cy = (y1 + y2) / 2 - Math.abs(dx / d) * d * 0.22;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

export function RouteMap({ className = "" }: { className?: string }) {
  const tas = cityByCode("TAS")!;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden fill="none" preserveAspectRatio="xMidYMid slice">
      {OTHER.map(([a, b], i) => {
        const d = arc(a, b);
        return d ? <path key={`${a}${b}`} d={d} pathLength={1} className="route-arc" style={{ ["--d" as string]: `${0.3 + i * 0.02}s` }} stroke="rgba(255,255,255,0.16)" strokeWidth="1" /> : null;
      })}
      {PILOT.map((b, i) => {
        const d = arc("TAS", b);
        return d ? <path key={b} d={d} pathLength={1} className="route-arc" style={{ ["--d" as string]: `${0.9 + i * 0.25}s` }} stroke="#FF5B1F" strokeWidth="2" /> : null;
      })}
      {CITIES.map((c, i) => (
        <circle key={c.code} cx={px(c.lon)} cy={py(c.lat)} r={c.code === "TAS" ? 5 : 2.4} className="route-node" style={{ ["--d" as string]: `${0.1 + i * 0.015}s` }} fill={c.code === "TAS" ? "#FF5B1F" : "rgba(255,255,255,0.7)"} />
      ))}
      <circle cx={px(tas.lon)} cy={py(tas.lat)} r="14" stroke="#FF5B1F" strokeOpacity="0.5" className="route-node" style={{ ["--d" as string]: "1.6s" }} />
      {LABELS.map((code) => {
        const c = cityByCode(code)!;
        return (
          <text key={code} x={px(c.lon) + 7} y={py(c.lat) - 7} fontSize="11" fontWeight="600" letterSpacing="0.06em" className="route-node" style={{ ["--d" as string]: "1.2s" }} fill={code === "TAS" ? "#FF5B1F" : "rgba(255,255,255,0.55)"}>
            {code}
          </text>
        );
      })}
    </svg>
  );
}
