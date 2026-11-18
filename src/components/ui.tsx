import type { ReactNode } from "react";
import { MODE_LABEL, type Mode } from "@/lib/constants";

const MODE_CLASS: Record<Mode, string> = {
  AIR: "bg-air",
  ROAD: "bg-road",
  SEA: "bg-sea",
};

/** Mode color identifies modes only. Never decoration. */
export function ModeTag({ mode }: { mode: Mode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
      <span aria-hidden className={`inline-block h-2.5 w-2.5 rounded-sm ${MODE_CLASS[mode]}`} />
      {MODE_LABEL[mode]}
    </span>
  );
}

export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <abbr
      title="All prices, carriers and capacities are invented demo data. They are not real quotes."
      className={`inline-block rounded border border-rule px-1.5 py-0.5 text-xs font-semibold normal-case text-muted underline decoration-dotted underline-offset-2 ${className}`}
    >
      Demo data
    </abbr>
  );
}

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-good px-1.5 py-0.5 text-xs font-semibold text-good">
      <span aria-hidden>✓</span> Verified
    </span>
  );
}

const STATUS_STYLE: Record<string, string> = {
  REQUESTED: "border-rule text-ink bg-paper",
  CONFIRMED: "border-air text-air bg-white",
  IN_PROGRESS: "border-road text-road bg-white",
  DELIVERED: "border-good text-good bg-white",
  REJECTED: "border-bad text-bad bg-white",
};
const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Requested",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In progress",
  DELIVERED: "Delivered",
  REJECTED: "Rejected",
};

/** Status always has text, never colour alone. Remounting on status change replays the small fade. */
export function StatusChip({ status }: { status: string }) {
  return (
    <span
      key={status}
      className={`chip-anim inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[status] ?? ""}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <h1 className="text-2xl font-bold">{title}</h1>
      {children}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="panel p-8 text-center">
      <p className="text-xl font-semibold">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-muted">{children}</div>}
    </div>
  );
}
