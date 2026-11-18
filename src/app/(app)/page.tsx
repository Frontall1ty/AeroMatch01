import { switchRole } from "../actions";
import { DemoBadge } from "@/components/ui";

export default function Landing() {
  return (
    <div className="mx-auto max-w-3xl py-8 md:py-14">
      <h1 className="condensed text-5xl font-bold leading-none md:text-[64px]">
        TAS <span className="text-muted">to</span> IST, DXB, ALA
      </h1>
      <p className="mt-5 max-w-2xl text-xl">
        Enter your cargo once. Compare air, road and sea from Tashkent side by side, see which option fits your deadline
        and budget, and request a booking.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <form action={switchRole.bind(null, "SHIPPER", undefined)}>
          <button className="btn w-full !min-h-[56px] text-base">Continue as shipper</button>
          <p className="mt-2 text-sm text-muted">Create a shipment, compare options, request a booking, follow milestones.</p>
        </form>
        <form action={switchRole.bind(null, "CARRIER", undefined)}>
          <button className="btn-secondary w-full !min-h-[56px] text-base">Continue as carrier</button>
          <p className="mt-2 text-sm text-muted">Add capacity in under a minute, approve requests, update milestones.</p>
        </form>
      </div>

      <section className="panel mt-10 p-4 text-sm">
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          <DemoBadge /> This is a demo.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          <li>All prices, carriers and capacities are invented. No carrier is connected.</li>
          <li>Capacity is entered by hand by carriers. Tracking is a milestone timeline updated by hand.</li>
          <li>There is no real login. The role switcher in the header is for the demo only.</li>
        </ul>
      </section>
    </div>
  );
}
