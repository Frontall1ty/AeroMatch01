"use client";

import { useEffect, useRef } from "react";
import type { Mode } from "@/lib/constants";
import type { Layout } from "@/lib/holds";
import { prefersReducedMotion } from "@/components/site/hooks";
import type { View, Viewer } from "@/three/viewer";

/** Still when the visitor paused motion, or prefers reduced motion and has not pressed Play. */
function isStill() {
  const m = document.documentElement.dataset.motion;
  return m === "paused" || (m !== "playing" && prefersReducedMotion());
}

/**
 * The 3D model of the vehicle with the cargo inside. three.js is loaded only when this comes into view, and nothing is
 * drawn while it is hidden (so a copy kept for a phone layout costs nothing on a wide screen). If WebGL is missing or
 * lost, `onFail` lets the caller show the drawing instead.
 */
export function Hold3D({
  mode,
  layout,
  view,
  label,
  onActive,
  onReady,
  onFail,
  className = "",
}: {
  mode: Mode;
  layout: Layout;
  view: View;
  label: string;
  onActive: (index: number | null) => void;
  onReady: (viewer: Viewer | null) => void;
  onFail: () => void;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const latest = useRef({ layout, view, onActive, onReady, onFail });
  latest.current = { layout, view, onActive, onReady, onFail };

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    let started = false;
    const start = async () => {
      if (started) return;
      started = true;
      try {
        const { createViewer } = await import("@/three/viewer");
        if (cancelled || !host.current) return;
        viewer.current = createViewer(host.current, {
          mode,
          layout: latest.current.layout,
          view: latest.current.view,
          still: isStill(),
          onHover: (i) => latest.current.onActive(i),
          onLost: () => latest.current.onFail(),
        });
        latest.current.onReady(viewer.current);
      } catch {
        if (!cancelled) latest.current.onFail();
      }
    };
    const io = new IntersectionObserver(([e]) => e.isIntersecting && start(), { rootMargin: "200px" });
    io.observe(el);
    const onMotion = () => viewer.current?.setStill(isStill());
    window.addEventListener("am-motion", onMotion);
    return () => {
      cancelled = true;
      io.disconnect();
      window.removeEventListener("am-motion", onMotion);
      viewer.current?.dispose();
      viewer.current = null;
      latest.current.onReady(null);
    };
  }, [mode]);

  useEffect(() => {
    viewer.current?.setLayout(layout);
  }, [layout]);

  useEffect(() => {
    viewer.current?.setView(view);
  }, [view]);

  return <div ref={host} role="img" aria-label={label} className={`cursor-grab active:cursor-grabbing ${className}`} />;
}
