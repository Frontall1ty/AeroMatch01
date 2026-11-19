import Link from "next/link";
import { CITIES, COUNTRIES } from "@/lib/places";
import { Board } from "../Board";
import { FitDemo } from "../FitDemo";
import { Integration } from "../Integration";
import { Race } from "../Race";
import { Band, SectionHead } from "./Parts";

export function RaceBand() {
  return (
    <Band id="race" tone="white" labelledBy="race-title">
      <SectionHead
        n="04"
        label="Race"
        id="race-title"
        title="Race the four ways."
        lead="Move the distance, say whether the cargo crosses an ocean, and choose what matters most. Which way wins changes with the distance, and some drop out."
      />
      <div className="mt-12"><Race /></div>
    </Band>
  );
}

const STEPS = [
  { tag: "Entry", title: "Enter the cargo once", text: "Where it starts, where it goes, how many pieces of what size. Weight, volume and floor space are worked out for you." },
  { tag: "Compare", title: "Compare what runs from your city", text: "Only the modes that really run on your lane. Each offer shows its vehicle, how full it is, when it leaves and what it costs." },
  { tag: "Request", title: "Request a booking", text: "The carrier approves or says why not. Nothing is paid inside AeroMatch: you agree on payment as you do today." },
  { tag: "Follow", title: "Follow it to delivery", text: "Steps that match the mode, from booked to delivered, updated by the carrier. Print a summary for your files." },
];

export function Steps() {
  return (
    <Band tone="paper" labelledBy="steps-title">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="site-label text-muted">05 — How it works</p>
          <h2 id="steps-title" className="display mt-6 text-[clamp(44px,5.6vw,88px)]">From cargo to booking</h2>
          <p className="mt-6 max-w-[36ch] text-lg text-muted">Four steps, and the first one takes about a minute.</p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2">
          {STEPS.map((s, i) => {
            const dark = i === 1;
            return (
              <li key={s.title} className={`flex min-h-[280px] flex-col rounded-lg border p-5 ${dark ? "on-dark border-console bg-console text-console-text" : "border-rule bg-panel"}`}>
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.08em]">
                  <span className={`grid h-8 w-8 place-items-center rounded-md text-sm normal-case tracking-normal ${dark ? "bg-signal text-ink" : "border border-rule"}`}>0{i + 1}</span>
                  <span className={dark ? "text-console-muted" : "text-muted"}>{s.tag}</span>
                </div>
                <h3 className="h-wide mt-auto pt-10 text-[26px]">{s.title}</h3>
                <p className={`mt-2 ${dark ? "text-console-muted" : "text-muted"}`}>{s.text}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </Band>
  );
}

export function BoardBand() {
  return (
    <Band id="board" tone="dark" labelledBy="board-title" className="aurora">
      <SectionHead
        n="06"
        label="Bookings"
        id="board-title"
        dark
        title="Every shipment on one board."
        lead="Once a booking is made you follow it the way you follow a flight: where it left, where it goes, how it travels and where it stands."
      />
      <div className="mt-12"><Board /></div>
    </Band>
  );
}

export function Stats() {
  const items = [
    [String(CITIES.length), "cities to ship from and to"],
    [String(COUNTRIES.length), "countries on the map"],
    ["4", "ways to ship, compared side by side"],
    ["1", "cargo entry for all of them"],
  ];
  return (
    <section className="bg-signal text-ink" aria-label="AeroMatch in numbers">
      <ul className="mx-auto grid max-w-[1320px] grid-cols-2 md:grid-cols-4">
        {items.map(([n, label], i) => (
          <li key={label} className={`px-4 py-10 md:px-6 md:py-14 ${i > 0 ? "md:border-l md:border-ink/20" : ""} ${i % 2 === 1 ? "border-l border-ink/20 md:border-l" : ""} ${i > 1 ? "border-t border-ink/20 md:border-t-0" : ""}`}>
            <p className="font-display text-[clamp(64px,8vw,120px)] leading-[0.9] tracking-[-0.04em]">{n}</p>
            <p className="mt-3 max-w-[20ch] font-semibold">{label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Carriers() {
  return (
    <Band id="carriers" tone="white" labelledBy="carriers-title">
      <SectionHead
        n="07"
        label="For carriers"
        id="carriers-title"
        title="Fill the space you already fly, sail and drive."
        lead="Airlines, trucking companies, rail operators and forwarders put free space in front of shippers on the lanes they run, at their own price."
      />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <div className="on-dark flex flex-col rounded-lg bg-console p-6 text-console-text md:col-span-2">
          <p className="site-label text-console-muted">Capacity</p>
          <h3 className="h-wide mt-6 text-[clamp(28px,3vw,40px)]">Capacity in about a minute.</h3>
          <ul className="mt-5 grid gap-2 text-console-muted sm:grid-cols-2">
            {["Fields come pre-filled for the mode", "Duplicate last week's listing in two clicks", "See how many pieces fit the free space", "Close a listing the moment it is full"].map((t) => (
              <li key={t} className="flex gap-2"><span aria-hidden className="text-ion-bright">✓</span>{t}</li>
            ))}
          </ul>
          <Link href="/register" className="btn-bright mt-8 self-start">Add your capacity</Link>
        </div>
        <div className="flex flex-col rounded-lg bg-signal p-6 text-ink">
          <p className="site-label site-label-ink">Trust</p>
          <p className="font-display mt-auto pt-8 text-[96px] leading-[0.85] tracking-[-0.04em]">3</p>
          <h3 className="mt-3 text-xl font-semibold">Verified by hand.</h3>
          <p className="mt-2">A carrier is shown to shippers once our team has checked it: a complete company profile, or 3 delivered shipments.</p>
        </div>
        <div className="rounded-lg border border-rule bg-paper p-6">
          <p className="site-label text-muted">Pricing</p>
          <h3 className="h-wide mt-6 text-[28px]">Your price, your unit.</h3>
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Price units">
            {["Per kg", "Per m² of floor", "Per vehicle", "Flat, whole truck"].map((t) => (
              <li key={t} className="rounded border border-rule bg-panel px-2.5 py-1 text-sm font-semibold">{t}</li>
            ))}
          </ul>
          <p className="mt-5 text-muted">Shippers see how each total is worked out from your unit.</p>
        </div>
        <div className="rounded-lg border border-rule p-4 md:col-span-2 md:p-6">
          <p className="site-label mb-4 text-muted">Space calculator</p>
          <FitDemo />
        </div>
        <div className="on-dark rounded-lg bg-console p-6 text-console-text md:col-span-3">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
            <div>
              <p className="site-label text-console-muted">For airlines</p>
              <h3 className="h-wide mt-6 text-[clamp(28px,3vw,40px)]">Next to your cargo system, not instead of it.</h3>
              <p className="mt-4 text-console-muted">Airlines keep capacity and booking in their own systems. AeroMatch is where a shipper compares air with rail and road, and where carriers without a system are found.</p>
            </div>
            <Integration />
          </div>
        </div>
      </div>
    </Band>
  );
}

const ROADMAP = [
  { when: "Now", title: "The pilot", text: `${CITIES.length} cities in ${COUNTRIES.length} countries, by air, sea, rail and road. Carriers add capacity by hand and are verified by our team.` },
  { when: "Next", title: "More people, more languages", text: "A Russian and an Uzbek interface. A message when a booking changes. More origins with real carriers." },
  { when: "Later", title: "Connected", text: "Telegram for adding capacity and updating milestones. Feeds from carrier and airline cargo systems." },
];

export function Journey() {
  return (
    <Band tone="dark" labelledBy="journey-title" className="aurora">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14">
        <div>
          <p className="site-label text-console-muted">08 — Where it goes</p>
          <h2 id="journey-title" className="display mt-6 text-[clamp(44px,5.6vw,88px)]">Starts in Tashkent.</h2>
          <p className="mt-6 max-w-[36ch] text-lg text-console-muted">One origin first, so everything in it is complete and honest. Lanes are data, so the next ones are added the same way.</p>
        </div>
        <ol className="relative border-l-2 border-signal pl-8">
          {ROADMAP.map((r) => (
            <li key={r.when} className="relative pb-12 last:pb-0">
              <span aria-hidden className="absolute -left-[41px] top-1 h-4 w-4 rounded-full border-4 border-console bg-signal" />
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-ion-bright">{r.when}</p>
              <h3 className="h-wide mt-2 text-[30px]">{r.title}</h3>
              <p className="mt-2 max-w-[56ch] text-console-muted">{r.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </Band>
  );
}

const FAQ: { q: string; a: React.ReactNode }[] = [
  { q: "Does AeroMatch take payment?", a: "No. Nothing is paid inside AeroMatch. You and the carrier agree on payment between yourselves, as you do today." },
  { q: "How do I know a carrier is real?", a: "Shippers only see verified carriers. A carrier is verified by our team once its company profile is complete, or after it has delivered 3 shipments." },
  { q: "Are the prices real?", a: "Not in this demo. Every price, carrier and capacity is invented and no carrier is connected. Every screen with prices says so." },
  { q: "Which cities can I ship between?", a: `${CITIES.length} cities in ${COUNTRIES.length} countries. Air runs between any two. Sea needs a port at both ends, rail needs the same rail network, and road needs a road link on the same landmass.` },
  { q: "Can I try it without signing up?", a: <>Yes. <Link href="/demo" className="font-semibold underline underline-offset-2">Open a demo account</Link> as a shipper or a carrier. It has invented data and needs no password.</> },
  { q: "What if my cargo is heavy or dangerous?", a: "Each offer states what it accepts. Options that cannot carry your shipment stay on the list with the reason, so you know what to change: the deadline, the size or the carrier." },
];

export function Faq() {
  return (
    <Band id="faq" tone="paper" labelledBy="faq-title">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="site-label text-muted">09 — Questions</p>
          <h2 id="faq-title" className="display mt-6 text-[clamp(44px,5.6vw,88px)]">Quick answers.</h2>
          <p className="mt-6 max-w-[36ch] text-lg text-muted">What people ask first, and what is and is not real in this demo.</p>
          <Link href="/demo" className="btn mt-8">Try a demo account</Link>
        </div>
        <div className="divide-y divide-rule border-y border-rule">
          {FAQ.map((f, i) => (
            <details key={f.q} className="group py-2" open={i === 0}>
              <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                <span><span className="condensed mr-3 text-base text-muted">0{i + 1}.</span>{f.q}</span>
                <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-rule text-xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-[62ch] pb-4 pl-9 text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </Band>
  );
}

export function FinalCta() {
  return (
    <section className="on-dark aurora border-b border-console-rule bg-console text-console-text" aria-labelledby="cta-title">
      <div className="col-lines mx-auto max-w-[1320px] px-4 py-20 md:px-6 md:py-28">
        <p className="site-label text-console-muted">10 — Start</p>
        <h2 id="cta-title" className="display mt-6 max-w-[14ch] text-[clamp(52px,7.4vw,120px)]">Try it with a shipment of your own.</h2>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/register" className="btn-bright !min-h-[56px] px-8 text-base">Sign up</Link>
          <Link href="/login" className="btn-ghost !min-h-[56px] px-8 text-base">Log in</Link>
        </div>
        <p className="mt-5 text-console-muted">
          Just looking? <Link href="/demo" className="font-semibold text-console-text underline underline-offset-2 hover:text-ion-bright">Use a demo account</Link>, no sign-up needed.
        </p>
      </div>
    </section>
  );
}
