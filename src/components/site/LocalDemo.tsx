"use client";

import { useEffect, useState } from "react";
import { DOCUMENT_CHECKLIST, DOCUMENT_CHECKLIST_NOTE, MILESTONES, MODE_LABEL, MODE_ORDER, type Mode } from "@/lib/constants";
import { prefersReducedMotion, useInView } from "./hooks";

/** Documents and milestones differ by mode. The timeline plays once, then you can step through it. */
export function LocalDemo() {
  const [mode, setMode] = useState<Mode>("RAIL");
  const [done, setDone] = useState(1);
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  const steps = MILESTONES[mode];

  useEffect(() => {
    setDone(1);
    if (!seen) return;
    if (prefersReducedMotion()) {
      setDone(steps.length);
      return;
    }
    let n = 1;
    const id = setInterval(() => {
      n += 1;
      setDone(n);
      if (n >= steps.length) clearInterval(id);
    }, 900);
    return () => clearInterval(id);
  }, [mode, seen, steps.length]);

  return (
    <div ref={ref} className="panel p-4 md:p-5">
      <div role="group" aria-label="Mode" className="flex overflow-hidden rounded border border-rule">
        {MODE_ORDER.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={`min-h-[44px] flex-1 px-4 text-sm font-semibold ${mode === m ? "bg-ink text-white" : "bg-panel hover:bg-paper"}`}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold">Documents</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {DOCUMENT_CHECKLIST[mode].map((d) => (
              <li key={d} className="flex gap-2"><span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />{d}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">{DOCUMENT_CHECKLIST_NOTE}</p>
        </div>

        <div aria-live="polite">
          <p className="text-sm font-semibold">Milestones the carrier updates</p>
          <ol className="mt-2">
            {steps.map((s, i) => {
              const isDone = i < done;
              return (
                <li key={s.label}>
                  <button type="button" onClick={() => setDone(i + 1)} className="relative flex w-full gap-3 pb-4 text-left last:pb-0">
                    {i < steps.length - 1 && (
                      <span aria-hidden className={`absolute left-[9px] top-5 h-full w-0.5 transition-colors duration-500 ${i < done - 1 ? "bg-good" : "bg-rule"}`} />
                    )}
                    <span aria-hidden className={`relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-colors duration-500 ${isDone ? "border-good bg-good text-white" : "border-rule bg-panel"}`}>
                      {isDone ? "✓" : ""}
                    </span>
                    <span className={`text-sm font-semibold ${isDone ? "" : "text-muted"}`}>
                      {s.label}
                      {s.code && <span className="ml-2 text-xs font-normal text-muted">{s.code}</span>}
                      <span className="sr-only">{isDone ? " (done)" : " (pending)"}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
