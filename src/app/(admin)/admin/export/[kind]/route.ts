import { NextResponse } from "next/server";
import { toCsv } from "@/lib/adminUtils";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

const LIMIT = 20000;

export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  // The route has its own check. The admin pages being hidden is not protection.
  if (!(await isAdmin())) return new NextResponse("Log in to admin first.", { status: 401 });
  const { kind } = await params;

  let rows: (string | number | boolean | Date | null)[][];
  if (kind === "companies") {
    const list = await prisma.company.findMany({ orderBy: { createdAt: "desc" }, take: LIMIT, include: { users: { select: { name: true, email: true } } } });
    rows = [
      ["id", "name", "type", "verified", "verified_at", "suspended_at", "country", "city", "phone", "address", "tax_id", "website", "created_at", "contacts"],
      ...list.map((c) => [c.id, c.name, c.type, c.verified, c.verifiedAt, c.suspendedAt, c.country, c.city, c.phone, c.address, c.taxId, c.website, c.createdAt, c.users.map((u) => `${u.name} <${u.email ?? ""}>`).join("; ")]),
    ];
  } else if (kind === "listings") {
    const list = await prisma.capacityListing.findMany({ orderBy: { createdAt: "desc" }, take: LIMIT, include: { carrier: { select: { name: true } } } });
    rows = [
      ["id", "carrier", "mode", "origin", "destination", "departure", "status", "pricing_unit", "unit_price", "currency", "free_weight_kg", "free_volume_m3", "equipment", "is_demo", "created_at"],
      ...list.map((l) => [l.id, l.carrier.name, l.mode, l.origin, l.destination, l.departureDate, l.status, l.pricingUnit, l.unitPrice, l.currency, l.availableWeightKg, l.availableVolumeM3, l.equipment, l.isDemo, l.createdAt]),
    ];
  } else if (kind === "bookings") {
    const list = await prisma.booking.findMany({
      orderBy: { createdAt: "desc" }, take: LIMIT,
      include: { shipment: { include: { shipper: { select: { name: true } } } }, listing: { include: { carrier: { select: { name: true } } } } },
    });
    rows = [
      ["id", "shipper", "carrier", "mode", "origin", "destination", "status", "total_price", "chargeable_weight_kg", "rejection_reason", "created_at"],
      ...list.map((b) => [b.id, b.shipment.shipper.name, b.listing.carrier.name, b.listing.mode, b.listing.origin, b.listing.destination, b.status, b.totalPrice, b.chargeableWeightKg, b.rejectionReason, b.createdAt]),
    ];
  } else {
    return new NextResponse("Unknown export.", { status: 404 });
  }

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aeromatch-${kind}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
