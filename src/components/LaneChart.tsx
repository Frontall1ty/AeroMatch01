"use client";

import { MODE_LABEL, type Mode } from "@/lib/constants";
import { addDays, formatDay } from "@/lib/dates";
import { money } from "@/lib/format";
import type { OfferView } from "@/lib/offers";

const COLOR: Record<Mode, string> = { AIR: "#1D4ED8", ROAD: "#B45309", RAIL: "#0F766E", SEA: "#6D28D9" };

const W = 960;
const LEFT = 64;
const RIGHT = 16;
const TOP = 34;
const ROW = 34;
const LANE_PAD = 10;
const AXIS = 30;

export function LaneChart({
  modes,
  offers,
  readyDate,
  deadlineDay,
  deadlineDate,
  recommendedId,
  activeId,
  onActive,
  onSelect,
}: {
  modes: Mode[]; // the modes that exist on this lane
  offers: OfferView[]; // OK offers only
  readyDate: string;
  deadlineDay: number;
  deadlineDate: string;
  recommendedId: string | null;
  activeId: string | null;
  onActive: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const ready = new Date(readyDate);
  const maxArrival = Math.max(deadlineDay, ...offers.map((o) => o.arrivalMaxDay), 1);
  const maxDay = maxArrival + 1;
  const plotW = W - LEFT - RIGHT;
  const x = (day: number) => LEFT + (day / maxDay) * plotW;

  const lanes = modes.map((mode) => {
    const rows = offers
      .filter((o) => o.mode === mode)
      .sort((a, b) => a.arrivalMinDay - b.arrivalMinDay || a.totalPrice - b.totalPrice);
    return { mode, rows, height: Math.max(1, rows.length) * ROW + LANE_PAD * 2 };
  });
  const totalH = lanes.reduce((s, l) => s + l.height, 0);
  const H = TOP + totalH + AXIS;

  const tickEvery = maxDay > 20 ? 5 : maxDay > 10 ? 2 : 1;
  const ticks: number[] = [];
  for (let d = 0; d <= maxDay; d += tickEvery) ticks.push(d);

  let y = TOP;
  return (
    <figure className="panel hidden p-3 md:block">
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Arrival windows by mode. A table with the same information follows." className="w-full">
        {/* lane backgrounds and labels */}
        {lanes.map((lane) => {
          const top = y;
          y += lane.height;
          return (
            <g key={lane.mode}>
              <rect x={0} y={top} width={W} height={lane.height} fill={lane.mode === "RAIL" ? "#F4F6F9" : "#FFFFFF"} />
              <line x1={0} x2={W} y1={top} y2={top} stroke="#D3D9E2" />
              <text x={8} y={top + lane.height / 2 + 5} fontSize={14} fontWeight={700} fill={COLOR[lane.mode]}>
                {MODE_LABEL[lane.mode]}
              </text>
              {lane.rows.length === 0 && (
                <text x={LEFT + 8} y={top + lane.height / 2 + 5} fontSize={13} fill="#4B5563">
                  No option meets your deadline
                </text>
              )}
              {lane.rows.map((o, i) => {
                const by = top + LANE_PAD + i * ROW + 4;
                const x1 = x(o.arrivalMinDay);
                const x2 = Math.max(x(o.arrivalMaxDay), x1 + 12);
                const rec = o.id === recommendedId;
                const active = o.id === activeId;
                const label = money(o.totalPrice);
                const labelLeft = x2 + 70 > W - RIGHT;
                return (
                  <g
                    key={o.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`${o.carrierName}, ${MODE_LABEL[o.mode]}, arrives ${formatDay(new Date(o.arrivalMinDate))} to ${formatDay(new Date(o.arrivalMaxDate))}, ${label}${rec ? ", recommended" : ""}. Press Enter to show in the table.`}
                    onMouseEnter={() => onActive(o.id)}
                    onMouseLeave={() => onActive(null)}
                    onFocus={() => onActive(o.id)}
                    onBlur={() => onActive(null)}
                    onClick={() => onSelect(o.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(o.id);
                      }
                    }}
                    className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-[#111827] [&:focus-visible>rect]:stroke-[3]"
                  >
                    <title>{`${o.carrierName}: ${formatDay(new Date(o.arrivalMinDate))} to ${formatDay(new Date(o.arrivalMaxDate))}, ${label}`}</title>
                    <rect
                      x={x1}
                      y={by}
                      width={x2 - x1}
                      height={ROW - 12}
                      rx={4}
                      fill={COLOR[o.mode]}
                      fillOpacity={active ? 1 : 0.82}
                      stroke="#111827"
                      strokeWidth={rec ? 3 : active ? 2 : 0}
                    />
                    <text
                      x={labelLeft ? x1 - 8 : x2 + 8}
                      y={by + (ROW - 12) / 2 + 5}
                      fontSize={13}
                      fontWeight={rec || active ? 700 : 600}
                      textAnchor={labelLeft ? "end" : "start"}
                      fill="#111827"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* axis */}
        <line x1={0} x2={W} y1={TOP + totalH} y2={TOP + totalH} stroke="#D3D9E2" />
        {ticks.map((d) => (
          <g key={d}>
            <line x1={x(d)} x2={x(d)} y1={TOP} y2={TOP + totalH} stroke="#D3D9E2" strokeDasharray={d === 0 ? "0" : "2 4"} />
            <text x={x(d)} y={TOP + totalH + 18} fontSize={12} textAnchor="middle" fill="#4B5563">
              {formatDay(addDays(ready, d))}
            </text>
          </g>
        ))}

        {/* deadline */}
        <line x1={x(deadlineDay)} x2={x(deadlineDay)} y1={TOP - 8} y2={TOP + totalH} stroke="#B91C1C" strokeWidth={2} />
        <text x={x(deadlineDay)} y={14} fontSize={13} fontWeight={700} textAnchor="middle" fill="#B91C1C">
          Deliver by {formatDay(new Date(deadlineDate))}
        </text>
      </svg>
      <figcaption className="px-1 pt-1 text-xs text-muted">
        Bars show the arrival window (earliest to latest) from your ready date. The outlined bar is the recommended option.
      </figcaption>
    </figure>
  );
}
