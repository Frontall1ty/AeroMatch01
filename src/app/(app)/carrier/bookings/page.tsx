import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDay } from "@/lib/dates";
import { kg, money } from "@/lib/format";
import { nextMilestone } from "@/lib/rules";
import { requireRole } from "@/lib/session";
import { MilestoneForm } from "@/components/MilestoneForm";
import { Timeline } from "@/components/Timeline";
import { DemoBadge, EmptyState, ModeTag, PageTitle, StatusChip } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ActiveBookings() {
  const session = await requireRole("CARRIER");
  const bookings = await prisma.booking.findMany({
    where: { status: { in: ["CONFIRMED", "IN_PROGRESS", "DELIVERED"] }, listing: { carrierCompanyId: session.companyId } },
    orderBy: { createdAt: "desc" },
    include: { listing: true, shipment: { include: { shipper: true } }, events: { orderBy: { createdAt: "asc" } } },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle title="Active bookings" />
      {bookings.length === 0 ? (
        <EmptyState title="No approved bookings yet">
          Approve a request and it appears here, where you move it through its milestones.
          <div className="mt-4"><Link href="/carrier/requests" className="btn">Go to requests</Link></div>
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {bookings.map((b) => {
            const next = nextMilestone(b.listing.mode, b.events.length);
            return (
              <li key={b.id} className="panel grid gap-5 p-4 md:grid-cols-[1fr_260px]">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-base font-semibold">{b.shipment.shipper.name}</p>
                    <StatusChip status={b.status} />
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted">
                    <ModeTag mode={b.listing.mode} />
                    <span>{b.listing.origin} to {b.listing.destination}, departs {formatDay(b.listing.departureDate)}</span>
                  </p>
                  <p className="mt-2 text-sm">
                    {b.shipment.commodity}, {b.shipment.cargoKind === "VEHICLES" ? `${b.shipment.vehicleCount} vehicles` : `${kg(b.shipment.weightKg)}`} · <span className="font-semibold">{money(b.totalPrice)}</span> <DemoBadge />
                  </p>
                  <div className="mt-4">
                    {next ? (
                      <MilestoneForm bookingId={b.id} nextLabel={next.label} />
                    ) : (
                      <p className="text-sm font-semibold text-good">Delivered. All milestones are recorded.</p>
                    )}
                  </div>
                </div>
                <Timeline mode={b.listing.mode} events={b.events} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
