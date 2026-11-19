"use client";

import { MODE_HEX_BRIGHT, MODE_LABEL, SAFETY_BY_MODE, type Mode } from "@/lib/constants";
import { MAX_RAIL_KM, MAX_ROAD_KM } from "@/lib/places";
import { useProgress } from "./useProgress";

const MODES: { mode: Mode; photo: string; time: string; priced: string; runs: string }[] = [
  { mode: "AIR", photo: "sky", time: "1 to 3 days", priced: "Per chargeable kg", runs: "Between any two cities" },
  { mode: "SEA", photo: "sea", time: "12 to 40 days", priced: "Per container, kg or vehicle", runs: "Port to port only" },
  { mode: "RAIL", photo: "rail", time: "3 to 20 days", priced: "Per m² of wagon floor", runs: `One rail network, up to ${MAX_RAIL_KM.toLocaleString("en-US")} km` },
  { mode: "ROAD", photo: "road", time: "2 to 15 days", priced: "Whole truck, per m² or per vehicle", runs: `One landmass, up to ${MAX_ROAD_KM.toLocaleString("en-US")} km` },
];

const WORDS = ["Air", "Sea", "Rail", "Road", "Air", "Sea", "Rail", "Road"];

/** The four ways: a marquee that follows the scroll, then one photograph per mode with its facts on glass. */
export function Modes() {
  const [ref, p] = useProgress<HTMLDivElement>(1, -0.2);
  return (
    <section id="modes" className="on-dark scroll-mt-16 overflow-hidden bg-console text-console-text" aria-labelledby="modes-title">
      <div className="col-lines mx-auto max-w-[1320px] px-4 pt-20 md:px-6 md:pt-28">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14">
          <div>
            <p className="site-label text-console-muted">03 — Four ways</p>
            <h2 id="modes-title" className="sr-only">Four ways to ship</h2>
          </div>
          <p className="max-w-[56ch] text-lg text-console-muted">
            The modes that appear depend on where the cargo starts and where it goes. Sea needs a port at both ends, rail the same network,
            road a road on the same landmass. Air goes anywhere.
          </p>
        </div>
      </div>

      <div ref={ref} aria-hidden className="mt-10 select-none">
        <div className="marquee-track" style={p === null ? undefined : { ["--m" as string]: String(p) }}>
          {WORDS.map((w, i) => (
            <span key={i} className="font-display whitespace-nowrap pr-[0.35em] text-[clamp(84px,15vw,230px)] leading-[0.9] tracking-[-0.045em]">
              {w}<span className="text-signal">.</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1320px] px-4 pb-20 pt-12 md:px-6 md:pb-28">
        <ul className="grid gap-4 md:grid-cols-2">
          {MODES.map((m) => (
            <li key={m.mode} className="photo-card relative overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/photos/${m.photo}-1280.webp`}
                srcSet={`/photos/${m.photo}-1280.webp 1280w, /photos/${m.photo}-1920.webp 1920w`}
                sizes="(min-width: 768px) 50vw, 100vw"
                alt=""
                width={1280}
                height={720}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover md:aspect-[16/12]"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="glass-deep absolute inset-x-3 bottom-3 rounded-lg p-4 md:inset-x-4 md:bottom-4">
                <h3 className="font-display flex items-center gap-3 text-[34px] leading-none tracking-[-0.03em]">
                  <span aria-hidden className="h-3 w-3 rounded-sm" style={{ background: MODE_HEX_BRIGHT[m.mode] }} />
                  {MODE_LABEL[m.mode]}
                </h3>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                  <div><dt className="text-xs text-console-muted">Typical time</dt><dd className="font-semibold">{m.time}</dd></div>
                  <div><dt className="text-xs text-console-muted">Priced</dt><dd className="font-semibold">{m.priced}</dd></div>
                  <div><dt className="text-xs text-console-muted">Runs</dt><dd className="font-semibold">{m.runs}</dd></div>
                  <div><dt className="text-xs text-console-muted">Safety</dt><dd className="font-semibold">{SAFETY_BY_MODE[m.mode]} of 5 <span className="font-normal text-console-muted">(demo estimate)</span></dd></div>
                </dl>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-console-muted">Photos: Pexels. Times are typical ranges, not quotes.</p>
      </div>
    </section>
  );
}
