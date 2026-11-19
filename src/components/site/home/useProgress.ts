"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../hooks";

/**
 * How far an element has travelled through the viewport, 0 to 1: 0 when its top reaches `start` (a share of the
 * window height from the top), 1 when its top reaches `end`. Null until measured, and always null with reduced motion,
 * so the server render and the reduced-motion view show the finished state.
 */
export function useProgress<T extends HTMLElement>(start = 0.85, end = 0.2) {
  const ref = useRef<T>(null);
  const [p, setP] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const top = el.getBoundingClientRect().top;
      const h = window.innerHeight;
      setP(Math.min(1, Math.max(0, (h * start - top) / (h * (start - end)))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [start, end]);
  return [ref, p] as const;
}
