"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "../hooks";

const KEY = "am-motion";

/** Stops or starts everything on the page that moves by itself: the hero map and the mode videos. */
function apply(paused: boolean) {
  document.documentElement.dataset.motion = paused ? "paused" : "playing";
  document.querySelectorAll<SVGSVGElement>("svg[data-motion]").forEach((s) => (paused ? s.pauseAnimations() : s.unpauseAnimations()));
  document.querySelectorAll<HTMLVideoElement>("video[data-motion]").forEach((v) => {
    if (paused) v.pause();
    else if (v.dataset.visible === "true") v.play().catch(() => {});
  });
  window.dispatchEvent(new CustomEvent("am-motion", { detail: { paused } }));
}

export function MotionToggle({ className = "" }: { className?: string }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(KEY);
    } catch {
      // storage can be blocked; the default then follows the system setting
    }
    const start = saved ? saved === "paused" : prefersReducedMotion();
    setPaused(start);
    apply(start);
    const sync = (e: Event) => setPaused((e as CustomEvent<{ paused: boolean }>).detail.paused);
    window.addEventListener("am-motion", sync);
    return () => window.removeEventListener("am-motion", sync);
  }, []);

  return (
    <button
      type="button"
      aria-pressed={paused}
      onClick={() => {
        const next = !paused;
        setPaused(next);
        apply(next);
        try {
          window.localStorage.setItem(KEY, next ? "paused" : "playing");
        } catch {
          // not remembered, still applied
        }
      }}
      className={`inline-flex min-h-[32px] items-center gap-2 rounded border border-white/20 px-2.5 text-xs font-semibold text-console-text transition-colors hover:border-ion-bright hover:text-white ${className}`}
    >
      <span aria-hidden className="inline-flex h-3 w-3 items-center justify-center">
        {paused ? (
          <svg viewBox="0 0 12 12" width="12" height="12"><path d="M3 1.5 L10.5 6 L3 10.5 Z" fill="currentColor" /></svg>
        ) : (
          <svg viewBox="0 0 12 12" width="12" height="12"><rect x="2.5" y="1.5" width="2.6" height="9" fill="currentColor" /><rect x="7" y="1.5" width="2.6" height="9" fill="currentColor" /></svg>
        )}
      </span>
      {paused ? "Play motion" : "Pause motion"}
    </button>
  );
}
