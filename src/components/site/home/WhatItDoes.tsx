import Link from "next/link";
import type { ReactNode } from "react";
import { CargoDemo } from "../CargoDemo";
import { HeroLanes } from "../HeroLanes";
import { LoadViewDemo } from "../LoadViewDemo";
import { LocalDemo } from "../LocalDemo";
import { PricingDemo } from "../PricingDemo";

const ROWS: { id: string; kicker: string; title: string; text: string; tags: string[]; demo: ReactNode }[] = [
  {
    id: "cargo",
    kicker: "One cargo entry",
    title: "Say what you ship once.",
    text: "How many pieces and how big one is. AeroMatch works out weight, volume and floor space, and what every mode would charge for it.",
    tags: ["Pieces and size", "Stackable or not", "Vehicles"],
    demo: <CargoDemo />,
  },
  {
    id: "compare",
    kicker: "Compare",
    title: "Every option on one timeline.",
    text: "Each offer shows when it arrives against your deadline and what it costs. Choose what matters most, and the recommendation follows the same rule the app uses.",
    tags: ["Cheapest", "Fastest", "Safest", "Meets the deadline"],
    demo: <HeroLanes />,
  },
  {
    id: "space",
    kicker: "Free space",
    title: "See how full it is.",
    text: "Every option shows its vehicle with the space split into positions: booked by others, your cargo, still free.",
    tags: ["Truck", "Aircraft", "Wagon", "Container", "Ship"],
    demo: <LoadViewDemo />,
  },
  {
    id: "pricing",
    kicker: "Pricing",
    title: "Priced the way each carrier sells.",
    text: "Airlines sell weight, a shared trailer sells floor space, a full truck is one price. Carriers choose their unit, and you see how each total is worked out.",
    tags: ["Per kg", "Per m²", "Per vehicle", "Flat"],
    demo: <PricingDemo />,
  },
  {
    id: "local",
    kicker: "Papers and steps",
    title: "Documents that match the mode.",
    text: "An air waybill, a CMR note and a rail consignment note are different papers. The checklist and the milestones change with the mode.",
    tags: ["Checklist", "Milestones", "Tracking by step"],
    demo: <LocalDemo />,
  },
];

/** What the product does: a sticky title on the left, one row per capability on the right, each with a working demo. */
export function WhatItDoes() {
  return (
    <section id="what" className="scroll-mt-16 bg-paper" aria-labelledby="what-title">
      <div className="col-lines mx-auto grid max-w-[1320px] gap-10 px-4 py-20 md:px-6 md:py-28 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="site-label text-muted">02 — What it does</p>
          <h2 id="what-title" className="display mt-6 text-[clamp(48px,6vw,92px)]">What it does</h2>
          <p className="mt-6 max-w-[38ch] text-lg text-muted">Five things that replace the phone calls. Every panel on the right is the real logic, running on invented demo data.</p>
          <ul className="mt-6 space-y-1.5 text-sm">
            {ROWS.map((r, i) => (
              <li key={r.id}><a href={`#${r.id}`} className="font-semibold hover:underline"><span className="condensed mr-2 text-muted">0{i + 1}</span>{r.kicker}</a></li>
            ))}
          </ul>
          <Link href="/register" className="btn mt-8 !min-h-[52px] px-6 text-base">Compare a shipment</Link>
        </div>

        <ol className="min-w-0">
          {ROWS.map((r, i) => (
            <li key={r.id} id={r.id} className="scroll-mt-20 border-t border-rule pb-16 pt-8 first:border-t-0 first:pt-0">
              <p className="text-sm font-semibold"><span className="condensed mr-2 text-base">0{i + 1}.</span><span className="text-muted">{r.kicker}</span></p>
              <h3 className="h-wide mt-3 text-[clamp(30px,3.4vw,48px)]">{r.title}</h3>
              <div className="mt-6">{r.demo}</div>
              <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <p className="max-w-[52ch] text-muted">{r.text}</p>
                <ul className="flex flex-wrap content-start gap-2" aria-label="Covers">
                  {r.tags.map((t) => (
                    <li key={t} className="rounded border border-rule bg-panel px-2.5 py-1 text-xs font-semibold">{t}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
