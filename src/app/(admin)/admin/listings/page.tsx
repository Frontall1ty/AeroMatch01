import { DataTable, Empty, FilterChips, PageHead, Pill, SearchForm, TD, TH, THEAD, TROW } from "@/components/admin/AdminUI";
import { ListingStatusButton } from "@/components/AdminControls";
import { cleanQuery, pickFilter } from "@/lib/adminUtils";
import { cityName, MODE_LABEL, MODE_ORDER, PRICING_UNIT_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { int, moneyPrecise } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

const STATUS = ["all", "open", "full", "closed"] as const;
const MODES = ["all", "air", "sea", "rail", "road"] as const;
const SOURCE = ["all", "real", "demo"] as const;
const LIMIT = 100;

export default async function Listings({ searchParams }: { searchParams: Promise<{ status?: string; mode?: string; source?: string; q?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = pickFilter(sp.status, STATUS);
  const mode = pickFilter(sp.mode, MODES);
  const source = pickFilter(sp.source, SOURCE);
  const q = cleanQuery(sp.q);

  const where = {
    ...(status !== "all" ? { status: status.toUpperCase() as "OPEN" | "FULL" | "CLOSED" } : {}),
    ...(mode !== "all" ? { mode: mode.toUpperCase() as "AIR" | "SEA" | "RAIL" | "ROAD" } : {}),
    ...(source !== "all" ? { isDemo: source === "demo" } : {}),
    ...(q
      ? {
          OR: [
            { carrier: { name: { contains: q, mode: "insensitive" as const } } },
            { origin: q.toUpperCase() },
            { destination: q.toUpperCase() },
          ],
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.capacityListing.findMany({
      where,
      include: { carrier: { select: { name: true, verified: true, suspendedAt: true } }, _count: { select: { bookings: true } } },
      orderBy: [{ createdAt: "desc" }, { departureDate: "asc" }],
      take: LIMIT,
    }),
    prisma.capacityListing.count({ where }),
  ]);

  const keep = (omit: string) => Object.fromEntries(Object.entries({ status, mode, source, q }).filter(([k, v]) => k !== omit && v && v !== "all"));

  return (
    <div>
      <PageHead title="Listings">Capacity that carriers have put on a lane. Close a listing to take it off the comparison at once; reopen it to put it back. Search by carrier or by a city code such as TAS.</PageHead>
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterChips basePath="/admin/listings" param="source" current={source} keep={keep("source")} options={[{ value: "all", label: "All sources" }, { value: "real", label: "Real accounts" }, { value: "demo", label: "Demo" }]} />
          <SearchForm action="/admin/listings" q={q} placeholder="Carrier or city code" keep={keep("q")} />
        </div>
        <FilterChips basePath="/admin/listings" param="status" current={status} keep={keep("status")} options={STATUS.map((s) => ({ value: s, label: s === "all" ? "Any status" : s[0].toUpperCase() + s.slice(1) }))} />
        <FilterChips basePath="/admin/listings" param="mode" current={mode} keep={keep("mode")} options={MODES.map((m) => ({ value: m, label: m === "all" ? "Any mode" : MODE_LABEL[m.toUpperCase() as (typeof MODE_ORDER)[number]] }))} />
      </div>

      {rows.length === 0 ? (
        <Empty>No listings match these filters.</Empty>
      ) : (
        <>
          <DataTable minWidth={1000}>
            <thead className={THEAD}>
              <tr><th className={TH}>Carrier</th><th className={TH}>Lane</th><th className={TH}>Departs</th><th className={TH}>Price</th><th className={TH}>Free</th><th className={TH}>Bookings</th><th className={TH}>Status</th><th className={TH}><span className="sr-only">Action</span></th></tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className={TROW}>
                  <td className={TD}>
                    <p className="font-semibold">{l.carrier.name}</p>
                    <p className="text-xs text-console-muted">{l.isDemo ? "demo" : "real"}{!l.carrier.verified ? ", not verified" : ""}{l.carrier.suspendedAt ? ", suspended" : ""}</p>
                  </td>
                  <td className={TD}>
                    <p className="font-semibold">{l.origin} to {l.destination}</p>
                    <p className="text-xs text-console-muted">{cityName(l.origin)} to {cityName(l.destination)}, {MODE_LABEL[l.mode]}, {l.equipment}</p>
                  </td>
                  <td className={TD}>{l.departureDate.toISOString().slice(0, 10)}</td>
                  <td className={TD}>{moneyPrecise(l.unitPrice)}<span className="block text-xs text-console-muted">{PRICING_UNIT_LABEL[l.pricingUnit]}</span></td>
                  <td className={TD}>{l.pricingUnit === "PER_VEHICLE" && l.availableVehicles !== null ? `${l.availableVehicles} vehicles` : `${int(l.availableWeightKg)} kg`}</td>
                  <td className={TD}>{l._count.bookings}</td>
                  <td className={TD}><Pill tone={l.status === "OPEN" ? "good" : l.status === "FULL" ? "warn" : "quiet"}>{l.status.toLowerCase()}</Pill></td>
                  <td className={TD}><ListingStatusButton listingId={l.id} status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          <p className="mt-3 text-sm text-console-muted">Showing {rows.length} of {int(total)}. Narrow the filters to see others.</p>
        </>
      )}
    </div>
  );
}
