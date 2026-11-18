import { MILESTONES, type Mode } from "@/lib/constants";

export function Timeline({
  mode,
  events,
}: {
  mode: Mode;
  events: { milestone: string; note: string; createdAt: Date | string }[];
}) {
  const steps = MILESTONES[mode];
  const done = new Map(events.map((e) => [e.milestone, e]));
  const nextIndex = steps.findIndex((s) => !done.has(s.label));

  return (
    <ol className="relative">
      {steps.map((s, i) => {
        const e = done.get(s.label);
        const isNext = i === nextIndex;
        return (
          <li key={s.label} className="relative flex gap-3 pb-5 last:pb-0">
            {i < steps.length - 1 && (
              <span aria-hidden className={`absolute left-[9px] top-5 h-full w-0.5 ${e ? "bg-good" : "bg-rule"}`} />
            )}
            <span
              aria-hidden
              className={`relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold ${
                e ? "border-good bg-good text-white" : isNext ? "border-ink bg-panel" : "border-rule bg-panel"
              }`}
            >
              {e ? "✓" : ""}
            </span>
            <div className="text-sm">
              <p className={`font-semibold ${e || isNext ? "" : "text-muted"}`}>
                {s.label}
                {s.code && <span className="ml-2 text-xs font-normal text-muted">{s.code}</span>}
                <span className="sr-only">{e ? " (done)" : isNext ? " (next)" : " (pending)"}</span>
              </p>
              {e ? (
                <p className="text-xs text-muted">
                  {new Date(e.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC
                  {e.note ? ` · ${e.note}` : ""}
                </p>
              ) : isNext ? (
                <p className="text-xs text-muted">Next</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
