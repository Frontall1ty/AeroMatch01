import Link from "next/link";
import { CargoDemo } from "@/components/site/CargoDemo";
import { FitDemo } from "@/components/site/FitDemo";
import { HeroLanes } from "@/components/site/HeroLanes";
import { Integration } from "@/components/site/Integration";
import { Story } from "@/components/site/Story";
import { LoadViewDemo } from "@/components/site/LoadViewDemo";
import { LocalDemo } from "@/components/site/LocalDemo";
import { PricingDemo } from "@/components/site/PricingDemo";
import { ModeTag } from "@/components/ui";

function Section({
  id,
  title,
  lead,
  children,
  dark = false,
}: {
  id: string;
  title: string;
  lead: React.ReactNode;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <section id={id} className={`scroll-mt-14 ${dark ? "bg-ink text-white" : "border-t border-rule"}`}>
      <div className="mx-auto grid max-w-[1180px] gap-8 px-4 py-14 md:py-20 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-[32px] font-bold leading-[1.05] md:text-[44px]">{title}</h2>
          <div className={`mt-4 max-w-[46ch] text-lg ${dark ? "text-white/80" : "text-muted"}`}>{lead}</div>
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

export default function Site() {
  return (
    <>
      {/* Hero: the decision chart is the page's one bold element */}
      <section className="mx-auto max-w-[1180px] px-4 pb-14 pt-10 md:pb-20 md:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
          <div>
            <h1 className="display text-[clamp(60px,8.4vw,104px)]">Compare every way to ship. Book the one that fits.</h1>
            <p className="mt-6 max-w-[44ch] text-xl">
              Enter your cargo once. See air, rail and road side by side, which ones meet your deadline, and what each
              would cost. Then request a booking.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="btn !min-h-[52px] px-6 text-base">Sign up</Link>
              <a href="#who" className="btn-secondary !min-h-[52px] px-6 text-base">See how it works</a>
            </div>
            <p className="mt-4 max-w-[48ch] text-sm text-muted">
              Pilot lane: Tashkent to Istanbul, Dubai and Almaty. Everything you see is demo data.
            </p>
          </div>
          <HeroLanes />
        </div>
      </section>

      <Story />

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

      <section className="border-t border-rule bg-panel">
        <div className="mx-auto max-w-[1180px] px-4 py-14 md:py-20">
          <h2 className="display text-[clamp(44px,6vw,76px)]">Try it with a shipment of your own.</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="btn !min-h-[56px] px-8 text-base">Sign up</Link>
            <Link href="/login" className="btn-secondary !min-h-[56px] px-8 text-base">Log in</Link>
          </div>
          <p className="mt-4 text-sm text-muted">
            Just looking? <Link href="/demo" className="font-semibold text-ink underline underline-offset-2">Use a demo account</Link>, no sign-up needed.
          </p>
          <p className="mt-6 max-w-[60ch] text-sm text-muted">
            Accounts are real, but every price, carrier and capacity shown here is invented demo data, and no carrier is connected.
          </p>
        </div>
      </section>
    </>
  );
}
