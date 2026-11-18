"use client";

import { useEffect, useRef } from "react";

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

const NO_JS = `.story{height:auto}.story-stage{position:static;height:auto;overflow:visible}.story-scene{position:relative;inset:auto;min-height:78vh;opacity:1!important;-webkit-mask-image:none!important;mask-image:none!important}.story-photo{transform:none!important}.story-text,.story-intro{opacity:1!important}.story-progress,.story-steps,.story-skip,.story-note{display:none}`;

/** A scene photograph: two sizes, decorative (the text next to it says what the scene is). */
function Photo({ name, priority }: { name: string; priority?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="story-photo"
      src={`/photos/${name}-1280.webp`}
      srcSet={`/photos/${name}-1280.webp 1280w, /photos/${name}-1920.webp 1920w`}
      sizes="100vw"
      alt=""
      width={1920}
      height={1080}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
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
 * Air, sea, road and rail as one scroll, told with photographs. The sky dissolves into the sea, a soft edge
 * sweeps in and reveals the road, and the rail yard rises from the bottom. The photos are in /public/photos
 * and none of them shows a real company's name or logo (see PHOTOS.md).
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
          <Photo name="sky" priority />
          <div className="story-shade" aria-hidden />
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
          <Photo name="sea" />
          <Text tone="sea" title="Sea" facts={["12 to 40 days", "Per container, per kg or per vehicle", "Only between two ports"]}>
            The lowest price for heavy cargo, and the slowest. It runs between two coastal cities, so an inland city never sees it, and a landlocked country is reached by road or rail first.
          </Text>
        </div>

        {/* 3. Road */}
        <div className="story-scene story-road">
          <Photo name="road" />
          <Text tone="road" title="Road" facts={["2 to 15 days", "Whole truck, per m² or per vehicle", "Safety 2 to 3 of 5 (demo estimate)"]}>
            Door to door wherever there is a road. A whole truck, a shared trailer priced per square metre, or a car carrier. You see which positions in the trailer are taken.
          </Text>
        </div>

        {/* 4. Rail */}
        <div className="story-scene story-rail">
          <Photo name="rail" />
          <Text tone="rail" title="Rail" facts={["3 to 20 days", "Per m² of wagon floor", "Same rail network only"]}>
            Steady and low cost over long distances, between cities on the same rail network. Wagons and container platforms, priced by the floor space your cargo needs.
          </Text>
        </div>

        <p className="story-note">
          Times and prices in the app are invented demo data. Photos:{" "}
          <a href="https://www.pexels.com" target="_blank" rel="noreferrer">Pexels</a>
        </p>
      </div>
    </section>
  );
}
