/** How AeroMatch sits next to an airline's cargo system. Illustrative: nothing is connected in the demo. */

const CAPACITY_IN = `{
  "flight": "XX0123",
  "origin": "TAS",
  "destination": "IST",
  "departure": "2026-11-24",
  "sellableKg": 30000,
  "bookedKg": 6000,
  "freeKg": 24000,
  "freeM3": 110
}`;

const BOOKING_OUT = `{
  "origin": "TAS",
  "destination": "IST",
  "pieces": 25,
  "grossWeightKg": 6000,
  "volumeM3": 40,
  "chargeableWeightKg": 6680,
  "rate": { "unit": "PER_KG", "amount": 2.6 },
  "natureOfGoods": "Cotton garments",
  "dangerousGoods": false
}`;

function Node({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded border border-white/25 p-4">
      <p className="text-base font-bold">{title}</p>
      <ul className="mt-2 space-y-1 text-sm text-white/80">
        {lines.map((l) => <li key={l}>{l}</li>)}
      </ul>
    </div>
  );
}

function Link({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-2 md:py-0" aria-hidden>
      <span className="text-xs text-white/70">{label}</span>
      <span className="relative block h-8 w-px bg-white/40 md:h-px md:w-full">
        <span className="flow-dot hidden md:block" />
      </span>
    </div>
  );
}

export function Integration() {
  return (
    <div>
      <div className="grid items-stretch gap-2 md:grid-cols-[1fr_8rem_1fr_8rem_1fr]">
        <Node title="Your cargo system" lines={["Flights and free capacity", "Sellable, booked, free"]} />
        <Link label="free capacity" />
        <div className="rounded border-2 border-white p-4">
          <p className="text-base font-bold">AeroMatch</p>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li>Air next to rail and road</li>
            <li>Local carriers add capacity by hand</li>
            <li>Decision layer and booking request</li>
          </ul>
        </div>
        <Link label="booking request" />
        <Node title="Back to your system" lines={["A booking with the fields an air waybill needs", "The carrier approves it there"]} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <figure className="min-w-0">
          <figcaption className="mb-2 text-sm font-semibold">Capacity coming in</figcaption>
          <pre tabIndex={0} className="overflow-x-auto rounded bg-white/10 p-4 text-xs leading-relaxed text-white/90">{CAPACITY_IN}</pre>
        </figure>
        <figure className="min-w-0">
          <figcaption className="mb-2 text-sm font-semibold">Booking going out</figcaption>
          <pre tabIndex={0} className="overflow-x-auto rounded bg-white/10 p-4 text-xs leading-relaxed text-white/90">{BOOKING_OUT}</pre>
        </figure>
      </div>
      <p className="mt-4 text-sm text-white/70">
        Illustrative only. Nothing is connected in this demo, and the flight number is invented. Air capacity can come from a feed. Road and
        rail carriers, who have no system to connect, add theirs in under a minute.
      </p>
    </div>
  );
}
