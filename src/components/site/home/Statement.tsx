"use client";

import { CITIES, COUNTRIES } from "@/lib/places";
import { useProgress } from "./useProgress";

const TEXT =
  "AeroMatch is one place where a shipper sees every way to move cargo from their city, and where a carrier finds the cargo to fill its free space.";

/** What AeroMatch is, in one sentence. The words darken as you scroll past; without motion they are all dark. */
export function Statement() {
  const [ref, p] = useProgress<HTMLDivElement>(0.9, 0.3);
  const words = TEXT.split(" ");
  const lit = p === null ? words.length : Math.round(p * words.length);
  return (
    <section className="bg-panel" aria-labelledby="what-it-is">
      <div className="col-lines mx-auto max-w-[1320px] px-4 py-20 md:px-6 md:py-28">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="what-it-is" className="site-label text-muted">01 — What it is</h2>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{CITIES.length} cities, {COUNTRIES.length} countries</p>
        </div>
        <div ref={ref} className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/photos/sky-1280.webp" alt="" width={1280} height={720} loading="lazy" className="hidden aspect-[3/4] w-full rounded-lg object-cover lg:block" />
          <div>
            <p className="font-display text-[clamp(32px,4.4vw,64px)] leading-[1.04] tracking-[-0.018em] [word-spacing:0.06em] text-ink">
              {words.map((w, i) => (
                <span key={i} className="reveal-word" data-on={i < lit ? "true" : "false"}>
                  {w}{" "}
                </span>
              ))}
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              <p className="max-w-[44ch] text-muted">
                Freight is still booked by phone: call five carriers, wait for five quotes, compare them on paper. AeroMatch puts the offers
                in one list, from the city where the cargo starts, with the price worked out and the reason when something does not fit.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/photos/rail-1280.webp" alt="" width={1280} height={720} loading="lazy" className="aspect-[16/10] w-full rounded-lg object-cover" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
