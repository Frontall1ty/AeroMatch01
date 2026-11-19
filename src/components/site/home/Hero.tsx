import Link from "next/link";
import { DemoBadge } from "@/components/ui";
import { MODE_HEX_BRIGHT, MODE_LABEL } from "@/lib/constants";
import { labelOffers } from "@/lib/decision";
import { money } from "@/lib/format";
import { MAX_RAIL_KM, MAX_ROAD_KM } from "@/lib/places";
import { HERO_OFFERS } from "../siteData";
import { Arrow } from "./Arrow";
import { MotionToggle } from "@/components/media/MotionToggle";
import { RouteMap } from "./RouteMap";

const LABEL = { CHEAPEST: "Cheapest", FASTEST: "Fastest", SAFEST: "Safest" } as const;

/** The first screen: what AeroMatch does, over the network it covers, with a real comparison in a glass panel. */
export function Hero() {
  const shown = HERO_OFFERS.filter((o) => o.id !== "air-value");
  const labels = labelOffers(shown);
  return (
    <section className="on-dark aurora relative overflow-hidden bg-console text-console-text" aria-labelledby="hero-title">
      <RouteMap className="pointer-events-none absolute inset-x-0 top-[5%] h-[60%] w-full opacity-45 md:opacity-95" />
      <div className="col-lines relative mx-auto max-w-[1320px] px-4 pb-10 pt-8 md:px-6 md:pb-14">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-console-muted">
          <p className="site-label">Freight comparison, 2026 pilot</p>
          <p className="hidden md:block">Air, sea, rail and road</p>
          <p className="hidden md:block">Pilot origin: Tashkent</p>
          <span className="flex items-center gap-2"><MotionToggle /><DemoBadge dark /></span>
        </div>

        <h1 id="hero-title" className="display mt-12 max-w-[14ch] text-[clamp(52px,8vw,124px)] md:mt-16">
          Every way to ship, side by side.
        </h1>

        <div className="mt-10 grid items-end gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
          <div>
            <p className="max-w-[46ch] text-lg leading-relaxed text-console-muted md:text-xl">
              Enter your cargo once. See the planes, ships, trains and trucks leaving your city, how full each one is, when it
              arrives and what it costs. Pick one and request a booking.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="btn-bright !min-h-[52px] px-6 text-base">Compare a shipment<Arrow /></Link>
              <Link href="/demo" className="btn-ghost !min-h-[52px] px-6 text-base">Try a demo account<Arrow /></Link>
            </div>
          </div>

          <div className="glass rounded-lg p-4 md:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold">Tashkent to Istanbul</p>
              <p className="text-xs text-console-muted">25 crates, 6,000 kg, 40 m³</p>
            </div>
            <ul className="mt-3 divide-y divide-white/10">
              {shown.map((o) => (
                <li key={o.id} className="-mx-2 grid grid-cols-[86px_minmax(0,1fr)_auto] items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-white/[0.06]">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: MODE_HEX_BRIGHT[o.mode] }} />
                    {MODE_LABEL[o.mode]}
                  </span>
                  <span className="min-w-0 text-sm">
                    <span className="block truncate text-console-muted">{o.detail}</span>
                    <span className="flex flex-wrap gap-1.5">
                      {(labels.get(o.id) ?? []).map((l) => (
                        <span key={l} className="rounded-sm bg-signal px-1.5 text-[11px] font-bold text-ink">{LABEL[l]}</span>
                      ))}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="condensed block text-xl font-bold leading-none">{money(o.totalPrice)}</span>
                    <span className="text-xs text-console-muted">{o.transitDaysMin} to {o.transitDaysMax} days</span>
                  </span>
                </li>
              ))}
            </ul>
            <a href="#what" className="mt-3 inline-block text-sm font-semibold text-ion-bright hover:underline">See how the comparison works</a>
          </div>
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/10 pt-6 text-sm md:grid-cols-4">
          {[
            ["AIR", "Between any two cities"],
            ["SEA", "Port to port only"],
            ["RAIL", `On one rail network, up to ${MAX_RAIL_KM.toLocaleString("en-US")} km`],
            ["ROAD", `On one landmass, up to ${MAX_ROAD_KM.toLocaleString("en-US")} km`],
          ].map(([m, t]) => (
            <li key={m}>
              <p className="font-display text-2xl" style={{ color: MODE_HEX_BRIGHT[m as keyof typeof MODE_HEX_BRIGHT] }}>{MODE_LABEL[m as keyof typeof MODE_LABEL]}</p>
              <p className="mt-1 text-console-muted">{t}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
