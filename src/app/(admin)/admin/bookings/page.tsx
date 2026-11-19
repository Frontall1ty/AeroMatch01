import { DataTable, Empty, FilterChips, PageHead, Pill, SearchForm, TD, TH, THEAD, TROW } from "@/components/admin/AdminUI";
import { cleanQuery, pickFilter } from "@/lib/adminUtils";
import { MODE_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { int, money } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

const STATUS = ["all", "requested", "confirmed", "in_progress", "delivered", "rejected"] as const;
const LABEL: Record<string, string> = { all: "All", requested: "Requested", confirmed: "Confirmed", in_progress: "In progress", delivered: "Delivered", rejected: "Rejected" };
const LIMIT = 100;

export default async function Bookings({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = pickFilter(sp.status, STATUS);
  const q = cleanQuery(sp.q);

  const where = {
    ...(status !== "all" ? { status: status.toUpperCase() as "REQUESTED" | "CONFIRMED" | "IN_PROGRESS" | "DELIVERED" | "REJECTED" } : {}),
    ...(q
      ? {
          OR: [
            { shipment: { shipper: { name: { contains: q, mode: "insensitive" as const } } } },
            { listing: { carrier: { name: { contains: q, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
  };
  const [rows, total, groups] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      include: { shipment: { include: { shipper: { select: { name: true } } } }, listing: { include: { carrier: { select: { name: true } } } } },
    }),
    prisma.booking.count({ where }),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const counts = Object.fromEntries(groups.map((g) => [g.status.toLowerCase(), g._count._all]));
  const all = groups.reduce((a, g) => a + g._count._all, 0);

  return (
    <div>
      <PageHead title="Bookings">Every booking request and where it stands. Carriers move them forward; this page is for watching, not for changing them.</PageHead>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterChips basePath="/admin/bookings" param="status" current={status} keep={{ q }} options={STATUS.map((s) => ({ value: s, label: LABEL[s], count: s === "all" ? all : counts[s] ?? 0 }))} />
        <SearchForm action="/admin/bookings" q={q} placeholder="Shipper or carrier" keep={{ status: status === "all" ? "" : status }} />
      </div>
      {rows.length === 0 ? (
        <Empty>No bookings match.</Empty>
      ) : (
        <>
          <DataTable minWidth={900}>
            <thead className={THEAD}>
              <tr><th className={TH}>Booked</th><th className={TH}>Shipper</th><th className={TH}>Carrier</th><th className={TH}>Lane</th><th className={TH}>Price</th><th className={TH}>Status</th></tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className={TROW}>
                  <td className={TD}>{b.createdAt.toISOString().slice(0, 10)}<span className="block text-xs text-console-muted">{b.id.slice(-6)}</span></td>
                  <td className={TD}>{b.shipment.shipper.name}</td>
                  <td className={TD}>{b.listing.carrier.name}</td>
                  <td className={TD}>{b.listing.origin} to {b.listing.destination}<span className="block text-xs text-console-muted">{MODE_LABEL[b.listing.mode]}</span></td>
                  <td className={TD}>{money(b.totalPrice)}<span className="block text-xs text-console-muted">{int(b.chargeableWeightKg)} kg</span></td>
                  <td className={TD}>
                    <Pill tone={b.status === "DELIVERED" ? "good" : b.status === "REJECTED" ? "bad" : b.status === "REQUESTED" ? "quiet" : "info"}>{b.status.replace("_", " ").toLowerCase()}</Pill>
                    {b.rejectionReason && <p className="mt-1 max-w-[220px] text-xs text-console-muted">{b.rejectionReason}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          <p className="mt-3 text-sm text-console-muted">Showing {rows.length} of {int(total)}.</p>
        </>
      )}
    </div>
  );
}
