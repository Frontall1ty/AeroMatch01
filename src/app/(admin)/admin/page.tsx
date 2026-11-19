import Link from "next/link";
import { BarList, Card, DayBars, PageHead, Pill, Tile } from "@/components/admin/AdminUI";
import { VerifyButton } from "@/components/AdminControls";
import { adminOverview } from "@/lib/adminData";
import { cityByCode, cityName, MODE_HEX_BRIGHT, MODE_LABEL, MODE_ORDER, type Mode } from "@/lib/constants";
import { money } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

const STATUS: { key: string; label: string; color: string }[] = [
  { key: "REQUESTED", label: "Requested", color: "#A3A3A3" },
  { key: "CONFIRMED", label: "Confirmed", color: "#8FA6FF" },
  { key: "IN_PROGRESS", label: "In progress", color: "#FB9A5A" },
  { key: "DELIVERED", label: "Delivered", color: "#6FD79A" },
  { key: "REJECTED", label: "Rejected", color: "#FCA5A5" },
];

const ago = (d: Date) => {
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 60 * 24) return `${Math.round(m / 60)} h ago`;
  return `${Math.round(m / 1440)} d ago`;
};

export default async function Admin() {
  await requireAdmin();
  const o = await adminOverview();
  const lane = (a: string, b: string) => `${cityByCode(a)?.name ?? a} to ${cityByCode(b)?.name ?? b}`;

  return (
    <div className="space-y-6">
      <PageHead title="Overview">What needs a decision today, and how the marketplace is moving. Figures include the invented demo records.</PageHead>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="Waiting for review"
          value={o.carriers.waitingCount}
          alert={o.carriers.waitingCount > 0}
          href="/admin/carriers?filter=waiting"
          sub={o.carriers.waitingCount > 0 ? "Carriers that qualify and are not verified yet" : "No carrier is waiting"}
        />
        <Tile label="Verified carriers" value={<>{o.carriers.verified}<span className="text-console-muted"> / {o.carriers.total}</span></>} href="/admin/carriers" sub={o.carriers.suspended > 0 ? `${o.carriers.suspended} suspended` : "None suspended"} />
        <Tile label="Open listings" value={o.listings.open} href="/admin/listings" sub={`${o.listings.full} full, ${o.listings.closed} closed`} />
        <Tile
          label="Bookings"
          value={o.bookings.total}
          href="/admin/bookings"
          alert={o.bookings.stale > 0}
          sub={o.bookings.stale > 0 ? `${o.bookings.stale} requested for more than 2 days` : `${o.bookings.byStatus.REQUESTED ?? 0} waiting for a carrier`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Bookings, last 14 days"><DayBars buckets={o.bookingsPerDay} label="Bookings per day" /></Card>
        <Card title="Shipments entered, last 14 days"><DayBars buckets={o.shipmentsPerDay} color="#8FA6FF" label="Shipments per day" /></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Bookings by status">
          <BarList rows={STATUS.map((s) => ({ label: s.label, value: o.bookings.byStatus[s.key] ?? 0, color: s.color }))} empty="No bookings yet." />
          <p className="mt-4 border-t border-console-rule pt-3 text-sm text-console-muted">
            Booked value <span className="condensed text-lg font-bold text-console-text">{money(o.bookedValue)}</span> in demo dollars, rejected bookings left out.
          </p>
        </Card>
        <Card title="Open capacity by mode">
          <BarList rows={MODE_ORDER.map((m: Mode) => ({ label: MODE_LABEL[m], value: o.openByMode[m] ?? 0, color: MODE_HEX_BRIGHT[m] }))} />
        </Card>
        <Card title="People">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-console-muted">Companies, real accounts</dt><dd className="condensed text-lg font-bold">{o.realCompanies}</dd></div>
            <div className="flex justify-between"><dt className="text-console-muted">Shippers</dt><dd className="condensed text-lg font-bold">{o.shippers}</dd></div>
            <div className="flex justify-between"><dt className="text-console-muted">Carriers, forwarders, agents</dt><dd className="condensed text-lg font-bold">{o.carriers.total}</dd></div>
          </dl>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Carriers to review" action={<Link href="/admin/carriers?filter=waiting" className="text-sm font-semibold text-ion-bright hover:underline">See all</Link>}>
          {o.carriers.waiting.length === 0 ? (
            <p className="text-sm text-console-muted">Nobody is waiting. New carriers appear here when their profile is complete or they have delivered 3 shipments.</p>
          ) : (
            <ul className="divide-y divide-console-rule">
              {o.carriers.waiting.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-console-muted">{c.type.toLowerCase()}{c.city ? `, ${cityName(c.city)}` : ""}{c.id.startsWith("demo-") ? ", demo" : ""}</p>
                  </div>
                  <VerifyButton companyId={c.id} verified={false} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Latest bookings" action={<Link href="/admin/bookings" className="text-sm font-semibold text-ion-bright hover:underline">See all</Link>}>
          {o.latestBookings.length === 0 ? (
            <p className="text-sm text-console-muted">No bookings yet.</p>
          ) : (
            <ul className="divide-y divide-console-rule">
              {o.latestBookings.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{b.shipment.shipper.name} <span className="font-normal text-console-muted">with {b.listing.carrier.name}</span></p>
                    <p className="text-xs text-console-muted">{lane(b.listing.origin, b.listing.destination)}, {MODE_LABEL[b.listing.mode]}</p>
                  </div>
                  <div className="text-right">
                    <Pill tone={b.status === "DELIVERED" ? "good" : b.status === "REJECTED" ? "bad" : b.status === "REQUESTED" ? "quiet" : "info"}>{b.status.replace("_", " ").toLowerCase()}</Pill>
                    <p className="mt-1 text-xs text-console-muted">{ago(b.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Latest admin activity" action={<Link href="/admin/activity" className="text-sm font-semibold text-ion-bright hover:underline">See all</Link>}>
        {o.latestActions.length === 0 ? (
          <p className="text-sm text-console-muted">Nothing yet. Verifying, suspending and closing listings are recorded here.</p>
        ) : (
          <ul className="divide-y divide-console-rule text-sm">
            {o.latestActions.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span><span className="font-semibold">{a.action}</span> <span className="text-console-muted">{a.targetName}</span></span>
                <span className="text-xs text-console-muted">{ago(a.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
