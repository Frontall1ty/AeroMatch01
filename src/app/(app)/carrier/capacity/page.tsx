import Link from "next/link";
import { ListingToggle } from "@/components/ListingToggle";
import { DemoBadge, EmptyState, ModeTag, PageTitle } from "@/components/ui";
import { cityName, PRICING_UNIT_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDay, todayUtc } from "@/lib/dates";
import { kg, moneyPrecise } from "@/lib/format";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "open", label: "Open" },
  { value: "full", label: "Full" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
] as const;
const LIMIT = 60;

export default async function MyCapacity({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await requireRole("CARRIER");
  const raw = (await searchParams).status;
  const filter = FILTERS.find((f) => f.value === raw)?.value ?? "open";

  const where = {
    carrierCompanyId: session.companyId,
    ...(filter === "all" ? {} : { status: filter.toUpperCase() as "OPEN" | "FULL" | "CLOSED" }),
    ...(filter === "open" ? { departureDate: { gte: todayUtc() } } : {}),
  };
  const [rows, total, counts] = await Promise.all([
    prisma.capacityListing.findMany({
      where,
      orderBy: [{ departureDate: "asc" }, { createdAt: "desc" }],
      take: LIMIT,
      include: { _count: { select: { bookings: true } } },
    }),
    prisma.capacityListing.count({ where }),
    prisma.capacityListing.groupBy({ by: ["status"], where: { carrierCompanyId: session.companyId }, _count: { _all: true } }),
  ]);
  const count = Object.fromEntries(counts.map((c) => [c.status.toLowerCase(), c._count._all]));
  const all = counts.reduce((a, c) => a + c._count._all, 0);

  return (
    <div>
      <PageTitle title="My capacity">
        <div className="flex flex-wrap items-center gap-3">
          <DemoBadge />
          <Link href="/carrier/capacity/new" className="btn">Add capacity</Link>
        </div>
      </PageTitle>

      {!session.verified && (
        <p className="mb-4 rounded border border-road px-3 py-2 text-sm text-road">
          Shippers do not see these listings until our team verifies your company. <Link href="/account" className="font-semibold underline">See what is missing</Link>.
        </p>
      )}

      <nav aria-label="Filter" className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "open" ? "/carrier/capacity" : `/carrier/capacity?status=${f.value}`}
            aria-current={filter === f.value ? "true" : undefined}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded border px-3 text-sm font-semibold ${filter === f.value ? "border-ink bg-ink text-white" : "border-rule bg-panel hover:border-ink"}`}
          >
            {f.label}
            <span className={`condensed text-base ${filter === f.value ? "" : "text-muted"}`}>{f.value === "all" ? all : count[f.value] ?? 0}</span>
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <EmptyState title={filter === "open" ? "No open listings" : "Nothing here"}>
          <p className="mt-1 text-muted">Add a flight, a truck, a wagon or a vessel and shippers can find it.</p>
          <Link href="/carrier/capacity/new" className="btn mt-4">Add capacity</Link>
        </EmptyState>
      ) : (
        <>
          <ul className="panel divide-y divide-rule">
            {rows.map((l) => {
              const total = l.capacityWeightKg ?? l.availableWeightKg;
              const used = Math.max(0, total - l.availableWeightKg);
              const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
              return (
                <li key={l.id} className="grid items-center gap-3 p-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <p className="font-semibold">{cityName(l.origin)} to {cityName(l.destination)}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-muted"><ModeTag mode={l.mode} /> <span>{l.equipment}</span></p>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold">Departs {formatDay(l.departureDate)}</p>
                    <p className="text-muted">{moneyPrecise(l.unitPrice)} {PRICING_UNIT_LABEL[l.pricingUnit].toLowerCase()}</p>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between"><span>{kg(l.availableWeightKg)} free</span><span className="text-muted">{pct}% booked</span></div>
                    <div className="mt-1 h-2 rounded-sm bg-paper" role="img" aria-label={`${pct} percent of ${kg(total)} booked`}>
                      <div className="h-full rounded-sm bg-ink" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted">{l._count.bookings} {l._count.bookings === 1 ? "booking" : "bookings"} · {l.status.toLowerCase()}</p>
                  </div>
                  <ListingToggle listingId={l.id} status={l.status} />
                </li>
              );
            })}
          </ul>
          {total > rows.length && <p className="mt-3 text-sm text-muted">Showing the first {rows.length} of {total}. The next departures come first.</p>}
        </>
      )}
    </div>
  );
}
