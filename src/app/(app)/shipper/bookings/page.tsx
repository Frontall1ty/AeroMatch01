import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDay } from "@/lib/dates";
import { money } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { AutoRefresh } from "@/components/AutoRefresh";
import { DemoBadge, EmptyState, ModeTag, PageTitle, StatusChip } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function MyBookings() {
  const session = await requireRole("SHIPPER");
  const bookings = await prisma.booking.findMany({
    where: { shipment: { shipperCompanyId: session.companyId } },
    orderBy: { createdAt: "desc" },
    include: { listing: { include: { carrier: true } }, shipment: true },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <AutoRefresh />
      <PageTitle title="My bookings" />
      {bookings.length === 0 ? (
        <EmptyState title="No bookings yet">
          Create a shipment, compare the options and use Request booking on the one you want.
          <div className="mt-4"><Link href="/shipper/new" className="btn">New shipment</Link></div>
        </EmptyState>
      ) : (
        <ul className="panel divide-y divide-rule">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link href={`/shipper/bookings/${b.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-paper">
                <div>
                  <p className="font-semibold">TAS to {b.listing.destination} · {b.listing.carrier.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted">
                    <ModeTag mode={b.listing.mode} />
                    <span>Departs {formatDay(b.listing.departureDate)}</span>
                    <span>{b.shipment.commodity}</span>
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-right">
                    <span className="block font-bold">{money(b.totalPrice)}</span>
                    <DemoBadge />
                  </span>
                  <StatusChip status={b.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
