import type { Mode } from "@/lib/constants";
import { int } from "@/lib/format";

const FILL: Record<Mode, string> = { AIR: "bg-air", SEA: "bg-sea", RAIL: "bg-rail", ROAD: "bg-road" };

/**
 * Free space on a vehicle: space already booked by others, your cargo, and what stays free.
 * Units are kg, or vehicle slots when the vehicle carries vehicles.
 */
export function SpaceBar({
  mode,
  total,
  free,
  yours,
  unit,
  compact = false,
}: {
  mode: Mode;
  /** Original capacity. Falls back to the free space when it is not known. */
  total: number | null;
  /** Free space now, before your cargo. */
  free: number;
  /** What your shipment takes. */
  yours: number;
  unit: "kg" | "slots";
  compact?: boolean;
}) {
  const cap = Math.max(total ?? free, free, 1);
  const booked = Math.max(0, cap - free);
  const fits = yours <= free;
  const yoursShown = Math.min(yours, free);
  const left = Math.max(0, free - yours);
  const pct = (n: number) => `${(n / cap) * 100}%`;
  const label = unit === "kg" ? "kg" : yours === 1 ? "slot" : "slots";

  return (
    <div>
      <div
        role="img"
        aria-label={`${int(free)} ${unit === "kg" ? "kg" : "slots"} free of ${int(cap)}. Your cargo takes ${int(yours)}. ${fits ? `${int(left)} would stay free.` : "It does not fit."}`}
        className={`flex w-full overflow-hidden rounded border border-rule bg-panel ${compact ? "h-2.5" : "h-3.5"}`}
      >
        <span className="bg-ink/25" style={{ width: pct(booked) }} />
        <span className={FILL[mode]} style={{ width: pct(yoursShown) }} />
        {/* what stays free is the empty part of the bar */}
      </div>
      <p className="mt-1 text-xs">
        <span className="font-semibold">{int(free)} {label}</span> free of {int(cap)}
        <span className="text-muted">
          {fits ? `, ${int(left)} left after you` : ", not enough for your cargo"}
        </span>
      </p>
    </div>
  );
}
