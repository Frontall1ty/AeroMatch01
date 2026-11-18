"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "./hooks";

/** A number that glides to its new value when it changes. Answers an action, never loops. */
export function CountUp({
  value,
  decimals = 0,
  duration = 600,
  format,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  format?: (n: number) => string;
}) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(value);
      from.current = value;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(a + (value - a) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const f = 10 ** decimals;
  const rounded = Math.round(shown * f) / f;
  return <>{format ? format(rounded) : rounded.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
}
