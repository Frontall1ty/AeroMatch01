import { prisma } from "@/lib/db";
import { addDays, formatDay, toInputDate, todayUtc } from "@/lib/dates";
import { kg, m3, moneyPrecise } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { CapacityForm } from "@/components/CapacityForm";
import { valuesForMode, type ListingValues } from "@/lib/listingValues";
import { ModeTag, PageTitle, DemoBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AddCapacity({ searchParams }: { searchParams: Promise<{ published?: string }> }) {
  const session = await requireRole("CARRIER");
  const { published } = await searchParams;

  const company = await prisma.company.findUniqueOrThrow({ where: { id: session.companyId } });
  const listings = await prisma.capacityListing.findMany({
    where: { carrierCompanyId: session.companyId },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  const lastRow = listings[0];
  const last: ListingValues | null = lastRow
    ? {
        mode: lastRow.mode,
        destination: lastRow.destination,
        departureDate: toInputDate(lastRow.departureDate),
        availableWeightKg: String(lastRow.availableWeightKg),
        availableVolumeM3: String(lastRow.availableVolumeM3),
        pricePerChargeableKg: String(lastRow.pricePerChargeableKg),
        transitDaysMin: String(lastRow.transitDaysMin),
        transitDaysMax: String(lastRow.transitDaysMax),
        equipment: lastRow.equipment,
        cutoffHours: String(lastRow.cutoffHours),
        maxPieceKg: String(lastRow.maxPieceKg),
        acceptsDangerousGoods: lastRow.acceptsDangerousGoods,
        minChargeableKg: String(lastRow.minChargeableKg),
        restrictions: lastRow.restrictions,
      }
    : null;

  // Sensible start: a freighter-style air listing a week out. A trucking company can switch mode with one click.
  const initial = valuesForMode("AIR", "IST", toInputDate(addDays(todayUtc(), 3)));

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="Add capacity">
        <span className="text-sm text-muted">{company.name}</span>
      </PageTitle>

      {published && (
        <p role="status" className="mb-4 rounded border border-good px-3 py-2 text-sm font-medium text-good">
          Capacity added. Shippers on this route can see it now. Use Duplicate last listing to repost it for another date.
        </p>
      )}
      {!company.verified && (
        <p className="mb-4 rounded border border-road px-3 py-2 text-sm text-road">
          This carrier is not verified, so shippers do not see its listings.
        </p>
      )}

      <CapacityForm initial={initial} last={last} today={toInputDate(todayUtc())} justPublished={!!published} />

      <section className="mt-10" aria-labelledby="mine">
        <h2 id="mine" className="mb-3 flex items-center gap-2 text-xl font-semibold">
          Your listings <DemoBadge />
        </h2>
        {listings.length === 0 ? (
          <p className="text-sm text-muted">No listings yet. Add your first capacity above.</p>
        ) : (
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-rule text-xs text-muted">
                <tr>
                  <th className="p-3 font-semibold">Mode</th>
                  <th className="p-3 font-semibold">Route</th>
                  <th className="p-3 font-semibold">Departs</th>
                  <th className="p-3 font-semibold">Left</th>
                  <th className="p-3 font-semibold">Price per kg</th>
                  <th className="p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => (
                  <tr key={l.id} className="border-b border-rule last:border-0">
                    <td className="p-3"><ModeTag mode={l.mode} /></td>
                    <td className="p-3">TAS to {l.destination}</td>
                    <td className="p-3">{formatDay(l.departureDate)}</td>
                    <td className="p-3">{kg(l.availableWeightKg)}, {m3(l.availableVolumeM3)}</td>
                    <td className="p-3">{moneyPrecise(l.pricePerChargeableKg)}</td>
                    <td className="p-3">{l.status === "OPEN" ? "Open" : l.status === "FULL" ? "Full" : "Closed"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
