import { switchRole } from "../../actions";
import { DemoBadge, ModeTag } from "@/components/ui";

export default function Landing() {
  return (
    <div className="mx-auto max-w-3xl py-8 md:py-14">
      <h1 className="text-[40px] font-bold leading-[1.05] md:text-[56px]">
        Compare every way to ship. Book the one that fits.
      </h1>
      <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1">
        <ModeTag mode="AIR" />
        <ModeTag mode="RAIL" />
        <ModeTag mode="ROAD" />
      </p>
      <p className="mt-5 max-w-2xl text-xl">
        Enter your cargo once. See every option side by side, which ones meet your deadline and budget, and request a
        booking.
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
          <li>
            The demo covers one pilot lane: Tashkent (TAS) to Istanbul (IST), Dubai (DXB) and Almaty (ALA). More lanes are
            added as carriers join.
          </li>
          <li>All prices, carriers and capacities are invented. No carrier is connected.</li>
          <li>Capacity is entered by hand by carriers. Tracking is a milestone timeline updated by hand.</li>
          <li>There is no real login. The role switcher in the header is for the demo only.</li>
        </ul>
      </section>
    </div>
  );
}
