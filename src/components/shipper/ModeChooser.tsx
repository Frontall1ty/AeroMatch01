"use client";

import { useEffect, useRef, useState } from "react";
import { MODE_LABEL, MODE_ORDER, type Mode } from "@/lib/constants";
import { HOLDS, type CargoInput } from "@/lib/holds";
import { DemoBadge } from "@/components/ui";
import { LoopVideo } from "@/components/media/LoopVideo";
import { MotionToggle } from "@/components/media/MotionToggle";
import { PlaneArt, ShipArt, TrainArt } from "@/components/site/Vehicles";
import { HoldView } from "./HoldView";

/** What the page knows about each way to ship from the shipper's city. Counts come from the database. */
export type ModeInfo = { available: boolean; reason: string; departures: number };

const MEDIA: Record<Mode, { photo: string; video?: string }> = {
  AIR: { photo: "/photos/sky", video: "air" },
  SEA: { photo: "/photos/sea" },
  RAIL: { photo: "/photos/rail" },
  ROAD: { photo: "/photos/road", video: "road" },
};

const COPY: Record<Mode, { body: string; speed: string; price: string; vehicle: string }> = {
  AIR: {
    body: "The fastest way, counted in days. Best for urgent, valuable or light cargo. You pay for the weight or for the space it takes, whichever is more.",
    speed: "Fastest",
    price: "Highest per kg",
    vehicle: "plane",
  },
  SEA: {
    body: "The lowest price per tonne for big, heavy loads that are not in a hurry. It needs a sea port at both ends.",
    speed: "Slowest",
    price: "Lowest per kg",
    vehicle: "ship",
  },
  RAIL: {
    body: "Steady over long distances and cheaper than road, on one connected rail network. Good for loads that fill a wagon.",
    speed: "Steady",
    price: "Low per kg",
    vehicle: "train",
  },
  ROAD: {
    body: "Door to door with the fewest handovers. Good for loads that fill one trailer or a few.",
    speed: "Fast on shorter lanes",
    price: "In the middle",
    vehicle: "truck",
  },
};

const metres = (cm: number) => (cm / 100).toLocaleString("en-US", { maximumFractionDigits: 1 });
const holdSize = (m: Mode) => `${metres(HOLDS[m].box.lengthCm)} × ${metres(HOLDS[m].box.widthCm)} m`;
const after = (m: Mode, step = 1) => MODE_ORDER[(MODE_ORDER.indexOf(m) + step) % MODE_ORDER.length];

function departuresText(info: ModeInfo, home: string) {
  if (!info.available) return info.reason;
  if (info.departures === 0) return `No open departures from ${home} right now`;
  return `${info.departures} open ${info.departures === 1 ? "departure" : "departures"} from ${home}`;
}

function Photo({ mode, className = "", sizes }: { mode: Mode; className?: string; sizes: string }) {
  const p = MEDIA[mode].photo;
  return <img src={`${p}-1280.webp`} srcSet={`${p}-1280.webp 1280w, ${p}-1920.webp 1920w`} sizes={sizes} alt="" className={className} width={1280} height={720} />;
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

/**
 * Step 1 of the new-shipment page: the four ways to ship, one large and three small, like a showroom.
 * The large card shows the vehicle on its way; "Look inside" cuts the roof off and shows the cargo space.
 * Choosing a way is a preference only: the comparison still covers every way that exists on the lane.
 */
export function ModeChooser({
  info,
  home,
  cargo,
  sample,
  onChoose,
}: {
  info: Record<Mode, ModeInfo>;
  /** The shipper's city, by name. */
  home: string;
  /** The cargo typed so far, or null to show the sample load. */
  cargo: CargoInput | null;
  sample: CargoInput;
  onChoose: (mode: Mode | null) => void;
}) {
  const [featured, setFeatured] = useState<Mode>(MODE_ORDER.find((m) => info[m].available) ?? "AIR");
  const [inside, setInside] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lookRef = useRef<HTMLButtonElement>(null);
  const opened = useRef(false);

  useEffect(() => {
    if (inside) {
      opened.current = true;
      closeRef.current?.focus();
    } else if (opened.current) {
      lookRef.current?.focus();
    }
  }, [inside]);

  function feature(m: Mode) {
    setInside(false);
    opened.current = false;
    setFeatured(m);
  }

  const i = info[featured];
  const c = COPY[featured];
  const label = MODE_LABEL[featured];
  const others = [1, 2, 3].map((s) => after(featured, s));
  const drawn = featured === "SEA" || featured === "RAIL";

  return (
    <section aria-labelledby="step1" className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[auto_1fr]">
      {/* The name of the way. On a phone the picture follows straight after it. */}
      <div className="lg:col-start-1 lg:row-start-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="site-label site-label-ink text-muted">Step 1 of 2 · How to ship</p>
          <MotionToggle light />
        </div>
        <h2 key={featured} id="step1" className="display stage-in mt-6 text-[clamp(48px,7vw,96px)] leading-[0.9]">
          {label}
          <br />
          <span className="text-muted">shipment</span>
        </h2>
      </div>

      {/* The large card and the three others */}
      <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <div className="mode-stage on-dark relative aspect-[4/5] overflow-hidden rounded-[28px] bg-console text-console-text sm:aspect-[16/11] lg:aspect-[5/4]">
          <div key={featured} className="stage-in absolute inset-0">
            {MEDIA[featured].video ? (
              <LoopVideo name={MEDIA[featured].video!} className="h-full w-full object-cover" />
            ) : (
              <Photo mode={featured} sizes="(min-width: 1024px) 720px, 100vw" className={`drift h-full w-full object-cover ${drawn ? "stage-blur" : ""}`} />
            )}
          </div>
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40" />

          {/* The vehicle on its way. Clicking it opens the cargo space, like the Look inside button. */}
          {featured === "AIR" && (
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[16%]">
              <div className="fly-across w-[52%] sm:w-[44%]">
                <PlaneArt className="w-full drop-shadow-[0_18px_22px_rgba(0,0,0,0.45)]" />
              </div>
            </div>
          )}
          {/* Sea and rail have no clean video yet: the photo goes soft behind, and a drawn ship or train travels in front */}
          {featured === "RAIL" && (
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[38%]">
              <div className="roll-across w-[92%]">
                <TrainArt className="w-full drop-shadow-[0_16px_18px_rgba(0,0,0,0.6)]" />
              </div>
              <div className="rail-track" />
            </div>
          )}
          {featured === "SEA" && (
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[24%] h-[44%]">
              <div className="sea-band absolute inset-x-0 bottom-0 h-[46%]" />
              <div className="sail-across absolute bottom-[30%] left-0 w-[64%] sm:w-[56%]">
                <div className="bob">
                  <ShipArt className="w-full drop-shadow-[0_18px_22px_rgba(0,0,0,0.55)]" />
                </div>
              </div>
            </div>
          )}
          <div aria-hidden className="absolute inset-0 cursor-zoom-in" onClick={() => !inside && setInside(true)} />

          {/* While the cutaway is open, what is under it cannot be reached with the keyboard */}
          <div inert={inside} className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-3">
            <span className="glass-deep rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide">
              <span className="condensed">0{MODE_ORDER.indexOf(featured) + 1}</span>
              <span className="text-console-muted"> / 04</span>
            </span>
            <button
              type="button"
              onClick={() => feature(after(featured))}
              aria-label={`Next way to ship: ${MODE_LABEL[after(featured)]}`}
              className="stage-next pointer-events-auto grid h-12 w-12 place-items-center rounded-full"
            >
              <Arrow className="h-5 w-5" />
            </button>
          </div>

          {/* The glass bar along the bottom */}
          <div inert={inside} className="glass-deep absolute inset-x-3 bottom-3 flex flex-col gap-3 rounded-2xl p-3 sm:inset-x-4 sm:bottom-4 sm:flex-row sm:items-center sm:p-4">
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl leading-tight sm:text-2xl">{label} shipment</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-console-muted">
                {departuresText(i, home)} {i.available && <DemoBadge dark />}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button ref={lookRef} type="button" className="btn-ghost !min-h-[44px] !border-white/35" onClick={() => setInside(true)} aria-expanded={inside} aria-controls="hold-inside">
                Look inside
              </button>
              <button type="button" className="btn-bright !min-h-[44px]" disabled={!i.available} onClick={() => onChoose(featured)}>
                Choose
              </button>
            </div>
          </div>

          {/* Inside: the roof is cut away and the cargo is loaded in front of you */}
          {inside && (
            <div id="hold-inside" className="stage-reveal absolute inset-0 flex flex-col overflow-y-auto bg-console/95 p-4 backdrop-blur-md sm:p-6">
              <HoldView
                mode={featured}
                cargo={cargo ?? sample}
                dark
                fit
                autoTurn
                note={cargo ? undefined : "Shown with a sample load of 25 crates: enter your cargo in step 2 and it is loaded here."}
                action={
                  <button ref={closeRef} type="button" className="btn-ghost !min-h-[44px] !border-white/35 !py-1 !text-xs" onClick={() => setInside(false)}>
                    Back to the {c.vehicle}
                  </button>
                }
              />
            </div>
          )}
        </div>

        <ul className="mt-3 grid grid-cols-3 gap-3" aria-label="Other ways to ship">
          {others.map((m) => (
            <li key={m}>
              <button
                type="button"
                onClick={() => feature(m)}
                className="mode-mini on-dark group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl bg-console text-left text-console-text sm:aspect-[4/3]"
              >
                <Photo mode={m} sizes="(min-width: 1024px) 240px, 33vw" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <span aria-hidden className="mini-arrow absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white text-ink">
                  <Arrow className="h-4 w-4 -rotate-45" />
                </span>
                <span className="glass-deep absolute inset-x-2 bottom-2 rounded-xl px-2.5 py-2">
                  <span className="block font-display text-base leading-tight sm:text-lg">{MODE_LABEL[m]}</span>
                  <span className={`mt-0.5 block text-xs leading-snug ${info[m].available ? "text-console-muted" : "text-[#FFB4A0]"}`}>
                    {info[m].available ? `${info[m].departures} open` : "Not offered here"}
                    <span className="sr-only">. Show {MODE_LABEL[m].toLowerCase()} shipment.</span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">Video: Mixkit. Photos: Pexels. Departures are demo data.</p>
      </div>

      {/* What it is good for, and the two ways forward */}
      <div className="flex flex-col lg:col-start-1 lg:row-start-2">
        <div key={featured} className="stage-in">
          <p className="max-w-[46ch] text-lg leading-relaxed">{c.body}</p>
          <dl className="mt-6 grid max-w-md grid-cols-3 border-y border-rule text-sm">
            {[
              ["Speed", c.speed],
              ["Price", c.price],
              ["The hold", holdSize(featured)],
            ].map(([k, v]) => (
              <div key={k} className="border-r border-rule py-3 pr-3 last:border-r-0 [&:not(:first-child)]:pl-3">
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="mt-1 font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <p className={`mt-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${i.available ? "border-good/30 bg-good/10 text-[#0F5F2B]" : "border-bad/30 bg-bad/10 text-bad"}`}>
            <span aria-hidden className={`h-2 w-2 rounded-full ${i.available ? "bg-good" : "bg-bad"}`} />
            {i.available ? `Offered from ${home}` : i.reason}
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3 lg:mt-auto lg:pt-8">
          <button type="button" className="btn-bright" disabled={!i.available} onClick={() => onChoose(featured)}>
            Ship by {label.toLowerCase()} <Arrow className="btn-arrow h-4 w-4" />
          </button>
          <button type="button" className="btn-secondary" onClick={() => onChoose(null)}>
            Compare all four
          </button>
        </div>
        <p className="mt-3 max-w-[48ch] text-xs text-muted">
          Your pick is where the comparison opens. It still shows every way that can carry your cargo.
        </p>
      </div>
    </section>
  );
}
