import Link from "next/link";
import { CargoDemo } from "@/components/site/CargoDemo";
import { FitDemo } from "@/components/site/FitDemo";
import { HeroLanes } from "@/components/site/HeroLanes";
import { Integration } from "@/components/site/Integration";
import { Story } from "@/components/site/Story";
import { Board } from "@/components/site/Board";
import { Race } from "@/components/site/Race";
import { LoadViewDemo } from "@/components/site/LoadViewDemo";
import { LocalDemo } from "@/components/site/LocalDemo";
import { PricingDemo } from "@/components/site/PricingDemo";
import { ModeTag } from "@/components/ui";
import { COUNTRIES, CITIES } from "@/lib/places";

function Section({
  id,
  title,
  lead,
  children,
  dark = false,
  wide = false,
}: {
  id: string;
  title: string;
  lead: React.ReactNode;
  children: React.ReactNode;
  dark?: boolean;
  /** The content goes under the heading, full width. */
  wide?: boolean;
}) {
  return (
    <section id={id} className={`scroll-mt-14 ${dark ? "on-dark bg-console text-console-text" : "border-t border-rule"}`}>
      <div className={`mx-auto grid max-w-[1180px] gap-8 px-4 py-14 md:py-20 lg:gap-14 ${wide ? "" : "lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]"}`}>
        <div className={wide ? "" : "lg:sticky lg:top-24 lg:self-start"}>
          <h2 className="h-wide text-[28px] md:text-[38px]">{title}</h2>
          <div className={`mt-4 max-w-[46ch] text-lg ${dark ? "text-console-muted" : "text-muted"}`}>{lead}</div>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

const REASONS: { carrier: string; detail: string; mode: "AIR" | "RAIL" | "ROAD"; reason: string }[] = [
  { carrier: "Demo Air Cargo B", detail: "Belly, wide-body", mode: "AIR", reason: "Max piece weight is 150 kg" },
  { carrier: "Demo Air Cargo B", detail: "Belly, narrow-body", mode: "AIR", reason: "Only 4,000 kg and 14 m³ left" },
  { carrier: "Demo Trucking Co", detail: "Car carrier", mode: "ROAD", reason: "Carries vehicles only" },
  { carrier: "Demo Trucking Co", detail: "Tent trailer, leaves when full", mode: "ROAD", reason: "Arrives 3 days after your deadline" },
  { carrier: "Demo Rail Freight", detail: "Covered wagon", mode: "RAIL", reason: "Arrives 1 day after your deadline" },
];

const STEPS: { title: string; text: string }[] = [
  { title: "Enter your cargo once", text: "Say where it starts, where it goes and how many pieces of what size. AeroMatch works out weight, volume and floor space." },
  { title: "Compare what runs from your city", text: "Air, sea, rail and road appear only where they really run. Each option shows its vehicle, how full it is, when it leaves and what it costs, marked cheaper, faster or safer." },
  { title: "Request a booking and follow it", text: "The carrier approves, and you follow steps that match the mode, from booked to delivered." },
];

const FAQ: { q: string; a: React.ReactNode }[] = [
  { q: "Does AeroMatch take payment?", a: "No. Nothing is paid inside AeroMatch. You and the carrier agree on payment between yourselves, as you do today." },
  { q: "How do I know a carrier is real?", a: "Shippers only see verified carriers. A carrier is verified by our team once its company profile is complete, or after it has delivered 3 shipments." },
  { q: "Are the prices real?", a: "Not in this demo. Every price, carrier and capacity is invented and no carrier is connected. Every screen with prices says so." },
  { q: "Which cities can I ship between?", a: `${CITIES.length} cities in ${COUNTRIES.length} countries. Air runs between any two. Sea needs a port at both ends, rail needs the same rail network, and road needs a road link on the same landmass.` },
  { q: "Can I try it without signing up?", a: <>Yes. <Link href="/demo" className="font-semibold text-ion underline underline-offset-2">Open a demo account</Link> as a shipper or a carrier. It has invented data and needs no password.</> },
  { q: "What if my cargo is heavy or dangerous?", a: "Each offer states what it accepts. Options that cannot carry your shipment stay on the list with the reason, so you know what to change: the deadline, the size or the carrier." },
];

export default function Site() {
  return (
    <>
      {/* Hero: the decision chart is the page's one bold element */}
      <section className="on-dark grid-dots border-b border-console-rule bg-console text-console-text">
       <div className="mx-auto max-w-[1180px] px-4 pb-14 pt-10 md:pb-20 md:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
          <div>
            <div className="route-rule mb-6 w-24" aria-hidden />
            <h1 className="display text-[clamp(32px,4.2vw,56px)]">Compare every way to ship. Book the one that fits.</h1>
            <p className="mt-6 max-w-[44ch] text-xl text-console-muted">
              Enter your cargo once. See air, rail and road side by side, which ones meet your deadline, and what each
              would cost. Then request a booking.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="btn-bright !min-h-[52px] px-6 text-base">Sign up</Link>
              <a href="#who" className="btn-ghost !min-h-[52px] px-6 text-base">See how it works</a>
            </div>
            <p className="mt-4 max-w-[48ch] text-sm text-console-muted">
              Pilot lane: Tashkent to Istanbul, Dubai and Almaty. Everything you see is demo data.
            </p>
          </div>
          <div className="on-light ticks text-ink"><HeroLanes /></div>
        </div>
       </div>
      </section>

      <Story />

      <Section id="how" wide title="From cargo to booking in three steps." lead="No form with fifty fields, and no calls to five carriers.">
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="panel ticks ticks-light p-5">
              <p className="condensed text-[40px] font-bold leading-none text-ion" aria-hidden>{i + 1}</p>
              <h3 className="mt-3 text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        id="board"
        wide
        title="Every shipment on one board."
        lead="Once a booking is made, you follow it the way you follow a flight: where it left from, where it is going, the way it travels and its status. Filter by air, sea, rail or road."
      >
        <Board />
      </Section>

      <Section
        id="race"
        wide
        title="Race the four ways."
        lead="Move the distance, say if the cargo crosses an ocean, and choose what matters most. The faster, cheaper and safer way changes with the distance, and some ways drop out."
      >
        <Race />
      </Section>

      <Section
        id="who"
        title="Two sides of one shipment."
        lead="Shippers need to know what is available and what it costs. Carriers need someone to fill their free space. AeroMatch puts both in the same place, from the city where the cargo starts."
      >
        <div className="panel divide-y divide-rule">
          <div className="p-5">
            <h3 className="text-xl font-semibold">If you ship cargo</h3>
            <p className="mt-2 text-muted">
              Enter your cargo once. See which modes run from your city, which have space, which meet your deadline and what each
              costs. Each option is marked cheaper, faster or safer, so you choose on what matters. Request a booking and follow it
              step by step.
            </p>
          </div>
          <div className="p-5">
            <h3 className="text-xl font-semibold">If you carry cargo</h3>
            <p className="mt-2 text-muted">
              Put your free space in front of shippers. Add a flight, a truck, a wagon or a vessel in about a minute, set your own
              price, then approve requests and update the milestones. Small carriers are welcome.
            </p>
          </div>
          <div className="p-5">
            <h3 className="text-xl font-semibold">How we keep it trustworthy</h3>
            <p className="mt-2 text-muted">
              Every carrier is verified by our team before shippers see its offers. A carrier is verified once its company profile is
              complete or it has finished 3 shipments. Nothing is paid inside AeroMatch.
            </p>
          </div>
        </div>
      </Section>

      <Section
        id="reasons"
        title="An option that is missing says why."
        lead="Offers that cannot carry your shipment do not vanish from the list. Each one shows the reason, so you know what to change: the deadline, the size, or the carrier."
      >
        <ul className="panel divide-y divide-rule">
          {REASONS.map((r) => (
            <li key={r.carrier + r.detail} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 p-4">
              <div>
                <p className="font-semibold">{r.carrier} <span className="font-normal text-muted">{r.detail}</span></p>
                <div className="mt-1"><ModeTag mode={r.mode} /></div>
              </div>
              <p className="text-sm font-medium text-bad">{r.reason}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="cargo"
        title="One cargo entry, not ten questions."
        lead="Say how many pieces you have and how big one is. AeroMatch works out weight, volume and floor space, then shows what every mode would charge. Change a number and everything follows."
      >
        <CargoDemo />
      </Section>

      <Section
        id="pricing"
        title="Every carrier prices its own way."
        lead="Airlines sell weight. A groupage trailer sells floor space. A full truck is one price. A car carrier charges per vehicle. Carriers choose their unit, and shippers see how each offer is worked out."
      >
        <PricingDemo />
      </Section>

      <Section
        id="space"
        title="See how full it is."
        lead="Every option shows its vehicle with the space split into positions. Grey is booked by others, colored is your cargo, white is still free. Move the slider and your cargo takes its place."
      >
        <LoadViewDemo />
      </Section>

      <Section
        id="capacity"
        title="Capacity in about a minute."
        lead={
          <>
            <p>A road or rail carrier picks a mode, a date and a price. The fields are pre-filled, and last week's listing can be reposted in two clicks.</p>
            <p className="mt-3">A space calculator shows how many pieces fit in the empty space, so the carrier knows what to offer.</p>
          </>
        }
      >
        <FitDemo />
      </Section>

      <Section
        id="local"
        title="Documents and milestones that match the mode."
        lead="An air waybill, a CMR note and a rail consignment note are different papers. Booked, loaded, border crossed are different steps. The checklist and the timeline change with the mode, and the carrier moves a booking forward one step at a time."
      >
        <LocalDemo />
      </Section>

      <Section
        id="systems"
        dark
        title="Next to your cargo system, not instead of it."
        lead="Airlines already run capacity and booking in their cargo systems. AeroMatch is the place where a shipper compares air with rail and road, and where carriers without a system can be found."
      >
        <Integration />
      </Section>

      <Section
        id="roadmap"
        title="Starts in Tashkent. Built for any lane."
        lead="The pilot is one origin so that everything in it is complete and honest. Lanes are data, so the next ones are added the same way."
      >
        <dl className="panel divide-y divide-rule">
          {[
            ["Now", "Tashkent to Istanbul, Dubai and Almaty by air, rail and road. Carriers enter capacity by hand."],
            ["Next", "More origins. Sea where both ends have a port. A Russian and an Uzbek interface."],
            ["Later", "Telegram for capacity entry and milestone updates. Feeds from carrier systems."],
          ].map(([when, what]) => (
            <div key={when} className="grid gap-1 p-4 sm:grid-cols-[5rem_1fr] sm:gap-4">
              <dt className="font-bold">{when}</dt>
              <dd className="text-muted">{what}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="faq" title="Questions people ask first." lead="Short answers, and what is and is not real in this demo.">
        <div className="panel divide-y divide-rule">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-4">
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden justify-between gap-4 text-lg font-semibold">
                {f.q}
                <span aria-hidden className="text-ion transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 max-w-[62ch] text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <section className="on-dark grid-dots border-t border-console-rule bg-console text-console-text">
        <div className="mx-auto max-w-[1180px] px-4 py-14 md:py-20">
          <div className="route-rule mb-6 w-24" aria-hidden />
          <h2 className="display text-[clamp(30px,4vw,52px)]">Try it with a shipment of your own.</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="btn-bright !min-h-[56px] px-8 text-base">Sign up</Link>
            <Link href="/login" className="btn-ghost !min-h-[56px] px-8 text-base">Log in</Link>
          </div>
          <p className="mt-4 text-sm text-console-muted">
            Just looking? <Link href="/demo" className="font-semibold text-console-text underline underline-offset-2 hover:text-ion-bright">Use a demo account</Link>, no sign-up needed.
          </p>
          <p className="mt-6 max-w-[60ch] text-sm text-console-muted">
            Accounts are real, but every price, carrier and capacity shown here is invented demo data, and no carrier is connected.
          </p>
        </div>
      </section>
    </>
  );
}
