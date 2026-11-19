import "server-only";
import { prisma } from "./db";
import { dayBuckets } from "./adminUtils";
import { verificationSummary } from "./verification";

/** Delivered bookings per carrier, in one query. */
export async function deliveredByCarrier(): Promise<Map<string, number>> {
  const rows = await prisma.booking.findMany({ where: { status: "DELIVERED" }, select: { listing: { select: { carrierCompanyId: true } } } });
  const out = new Map<string, number>();
  for (const r of rows) out.set(r.listing.carrierCompanyId, (out.get(r.listing.carrierCompanyId) ?? 0) + 1);
  return out;
}

const DAY = 86_400_000;

export async function adminOverview() {
  const since = new Date(Date.now() - 13 * DAY);
  const staleBefore = new Date(Date.now() - 2 * DAY);

  const [carriers, delivered, shippers, realCompanies, listingStatus, openByMode, bookingStatus, bookedValue, recentBookingDates, recentShipmentDates, staleRequests, latestBookings, latestActions] =
    await Promise.all([
      prisma.company.findMany({ where: { type: { not: "SHIPPER" } } }),
      deliveredByCarrier(),
      prisma.company.count({ where: { type: "SHIPPER" } }),
      prisma.company.count({ where: { NOT: { id: { startsWith: "demo-" } } } }),
      prisma.capacityListing.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.capacityListing.groupBy({ by: ["mode"], where: { status: "OPEN" }, _count: { _all: true } }),
      prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.booking.aggregate({ where: { status: { not: "REJECTED" } }, _sum: { totalPrice: true } }),
      prisma.booking.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.shipmentRequest.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.booking.count({ where: { status: "REQUESTED", createdAt: { lt: staleBefore } } }),
      prisma.booking.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { shipment: { include: { shipper: { select: { name: true } } } }, listing: { include: { carrier: { select: { name: true } } } } },
      }),
      prisma.adminAction.findMany({ orderBy: { at: "desc" }, take: 6 }),
    ]);

  const summaries = carriers.map((c) => ({ company: c, summary: verificationSummary(c, delivered.get(c.id) ?? 0) }));
  const waiting = summaries.filter((x) => !x.company.verified && !x.company.suspendedAt && x.summary.eligible);

  const byStatus = (rows: { status: string; _count: { _all: number } }[]) => Object.fromEntries(rows.map((r) => [r.status, r._count._all])) as Record<string, number>;
  const bookings = byStatus(bookingStatus);
  const listings = byStatus(listingStatus);

  return {
    carriers: {
      total: carriers.length,
      verified: carriers.filter((c) => c.verified).length,
      suspended: carriers.filter((c) => c.suspendedAt).length,
      waiting: waiting.slice(0, 5).map((x) => x.company),
      waitingCount: waiting.length,
    },
    shippers,
    realCompanies,
    listings: { open: listings.OPEN ?? 0, full: listings.FULL ?? 0, closed: listings.CLOSED ?? 0, total: Object.values(listings).reduce((a, b) => a + b, 0) },
    openByMode: Object.fromEntries(openByMode.map((r) => [r.mode, r._count._all])) as Record<string, number>,
    bookings: { byStatus: bookings, total: Object.values(bookings).reduce((a, b) => a + b, 0), stale: staleRequests },
    bookedValue: bookedValue._sum.totalPrice ?? 0,
    bookingsPerDay: dayBuckets(recentBookingDates.map((b) => b.createdAt), 14),
    shipmentsPerDay: dayBuckets(recentShipmentDates.map((b) => b.createdAt), 14),
    latestBookings,
    latestActions,
  };
}

/** How many carriers wait for a review: qualified, not verified, not suspended. Shown on the nav. */
export async function waitingCarrierCount(): Promise<number> {
  const [carriers, delivered] = await Promise.all([
    prisma.company.findMany({ where: { type: { not: "SHIPPER" }, verified: false, suspendedAt: null } }),
    deliveredByCarrier(),
  ]);
  return carriers.filter((c) => verificationSummary(c, delivered.get(c.id) ?? 0).eligible).length;
}
