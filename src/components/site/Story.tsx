"use client";

import { useEffect, useRef } from "react";
import { PlaneArt, ShipArt, TrainArt, TruckArt } from "./Vehicles";

/** Writes how far through the story you have scrolled (0 to 1) into the --p custom property. */
function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const box = el.getBoundingClientRect();
      const stage = el.querySelector<HTMLElement>(".story-stage");
      const stickyTop = stage ? parseFloat(getComputedStyle(stage).top) || 0 : 0;
      const total = Math.max(1, box.height - (stage?.offsetHeight ?? window.innerHeight));
      const p = Math.min(1, Math.max(0, (stickyTop - box.top) / total));
      el.style.setProperty("--p", p.toFixed(4));
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
  }, []);
  return ref;
}

const NO_JS = `.story{height:auto}.story-stage{position:static;height:auto;overflow:visible}.story-scene{position:relative;inset:auto;min-height:78vh;opacity:1!important;-webkit-mask-image:none!important;mask-image:none!important}.story-vehicle{transform:none!important;opacity:1!important;left:6vw}.story-text,.story-intro{opacity:1!important}.story-progress,.story-steps,.story-skip,.story-note{display:none}`;

function Cloud({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 160 64" className={`story-cloud ${className ?? ""}`} style={style} aria-hidden>
      <path d="M18 60 Q4 60 4 46 Q4 32 20 32 Q24 12 46 14 Q60 0 82 10 Q104 4 116 22 Q140 20 142 40 Q156 42 156 52 Q156 60 144 60 Z" />
    </svg>
  );
}

function Hills({ colors }: { colors: [string, string] }) {
  return (
    <div className="story-layer story-hills" aria-hidden>
      <svg viewBox="0 0 1200 100" preserveAspectRatio="none">
        <path d="M0 100 V58 C140 20 300 44 460 52 S760 14 920 38 S1120 56 1200 30 V100 Z" fill={colors[0]} />
        <path d="M0 100 V76 C180 50 340 80 520 70 S860 46 1020 64 S1160 78 1200 62 V100 Z" fill={colors[1]} />
      </svg>
    </div>
  );
}

function Text({ tone, title, children, facts }: { tone: string; title: string; children: React.ReactNode; facts: string[] }) {
  return (
    <div className={`story-text story-text-${tone}`}>
      <h3 className="text-[28px] font-bold leading-none">{title}</h3>
      <p className="mt-2 text-base">{children}</p>
      <ul className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        {facts.map((f) => (
          <li key={f} className="rounded border border-rule px-2 py-1">{f}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Air, sea, road and rail as one scroll. The plane flies out of the sky and the sea scene fades in under it,
 * a soft edge sweeps across and reveals the road, and the rail yard rises from the bottom.
 * Everything is drawn in code.
 */
export function Story() {
  const ref = useScrollProgress<HTMLElement>();
  return (
    <section ref={ref} id="ways" className="story" aria-label="Air, sea, road and rail: a story you scroll through">
      <noscript><style>{NO_JS}</style></noscript>
      <div className="story-stage">
        <div className="story-progress" aria-hidden />
        <p className="story-steps" aria-hidden>
          <span className="story-step-air">Air</span>
          <span className="story-step-sea">Sea</span>
          <span className="story-step-road">Road</span>
          <span className="story-step-rail">Rail</span>
        </p>
        <a href="#who" className="story-skip btn-secondary !min-h-[40px] !bg-white">Skip the story</a>

        {/* 1. Sky */}
        <div className="story-scene story-sky">
          <div className="story-sun" aria-hidden />
          <Cloud className="w-[26vw] max-w-[320px]" style={{ left: "60%", top: "14%", transform: "translateX(calc(var(--p) * -60vw))" }} />
          <Cloud className="w-[18vw] max-w-[220px]" style={{ left: "18%", top: "58%", transform: "translateX(calc(var(--p) * -30vw))", opacity: 0.85 }} />
          <Cloud className="w-[34vw] max-w-[420px]" style={{ left: "72%", top: "62%", transform: "translateX(calc(var(--p) * -90vw))" }} />
          <PlaneArt className="story-vehicle story-plane" />
          <div className="story-intro">
            <h2 className="text-[34px] font-bold leading-[1.05] md:text-[48px]">Four ways to move cargo. One place to compare them.</h2>
            <p className="mt-3 text-lg">Scroll to follow a shipment from the sky to the sea, onto the road and onto the rails.</p>
          </div>
          <Text tone="air" title="Air" facts={["1 to 3 days", "Safety 5 of 5 (demo estimate)", "Priced per chargeable kg"]}>
            The fastest way, and the gentlest on cargo. Freighters and the belly of passenger flights. You see how full each hold is and how much space your cargo takes.
          </Text>
        </div>

        {/* 2. Sea */}
        <div className="story-scene story-sea">
          <Cloud className="w-[20vw] max-w-[260px]" style={{ left: "64%", top: "8%", transform: "translateX(calc(var(--p) * -40vw))" }} />
          <div className="story-layer story-waves" />
          <div className="story-layer story-waves" style={{ ["--wspeed" as string]: "-500px", opacity: 0.25, backgroundSize: "260px 70px", top: "58%" }} />
          <ShipArt className="story-vehicle story-ship" />
          <Text tone="sea" title="Sea" facts={["12 to 40 days", "Per container, per kg or per vehicle", "Only between two ports"]}>
            The lowest price for heavy cargo, and the slowest. It runs between two coastal cities, so an inland city never sees it, and a landlocked country is reached by road or rail first.
          </Text>
        </div>

        {/* 3. Road */}
        <div className="story-scene story-road">
          <Hills colors={["#bcdca0", "#9ec97f"]} />
          <div className="story-layer story-trees" />
          <div className="story-layer story-roadbed"><div className="story-lane" /></div>
          <TruckArt className="story-vehicle story-truck" />
          <Text tone="road" title="Road" facts={["2 to 15 days", "Whole truck, per m² or per vehicle", "Safety 2 to 3 of 5 (demo estimate)"]}>
            Door to door wherever there is a road. A whole truck, a shared trailer priced per square metre, or a car carrier. You see which positions in the trailer are taken.
          </Text>
        </div>

        {/* 4. Rail */}
        <div className="story-scene story-rail">
          <Hills colors={["#c3dfa9", "#a8cf8a"]} />
          <div className="story-layer story-ballast">
            <div className="story-sleepers" />
            <div className="story-railline" style={{ top: "22%" }} />
            <div className="story-railline" style={{ bottom: "22%" }} />
          </div>
          <TrainArt className="story-vehicle story-train" />
          <Text tone="rail" title="Rail" facts={["3 to 20 days", "Per m² of wagon floor", "Same rail network only"]}>
            Steady and low cost over long distances, between cities on the same rail network. Wagons and container platforms, priced by the floor space your cargo needs.
          </Text>
        </div>

        <p className="story-note">Times and prices in the app are invented demo data.</p>
      </div>
    </section>
  );
}
