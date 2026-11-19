import { DataTable, Empty, PageHead, Pill, SearchForm, TD, TH, THEAD, TROW } from "@/components/admin/AdminUI";
import { cleanQuery } from "@/lib/adminUtils";
import { cityByCode } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";
const LIMIT = 150;

export default async function Shippers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const q = cleanQuery((await searchParams).q);

  const [companies, bookings] = await Promise.all([
    prisma.company.findMany({
      where: {
        type: "SHIPPER",
        ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { users: { some: { email: { contains: q, mode: "insensitive" as const } } } }] } : {}),
      },
      include: { users: { select: { name: true, email: true } }, _count: { select: { shipments: true } } },
      orderBy: { createdAt: "desc" },
      take: LIMIT,
    }),
    prisma.booking.findMany({ select: { shipment: { select: { shipperCompanyId: true } } } }),
  ]);
  const bookingCount = new Map<string, number>();
  for (const b of bookings) bookingCount.set(b.shipment.shipperCompanyId, (bookingCount.get(b.shipment.shipperCompanyId) ?? 0) + 1);

  return (
    <div>
      <PageHead title="Shippers">Companies that enter cargo and request bookings. Shippers need no verification.</PageHead>
      <div className="mb-4"><SearchForm action="/admin/shippers" q={q} placeholder="Company or email" /></div>
      {companies.length === 0 ? (
        <Empty>No shippers match.</Empty>
      ) : (
        <DataTable minWidth={760}>
          <thead className={THEAD}>
            <tr><th className={TH}>Company</th><th className={TH}>Contact</th><th className={TH}>Shipments</th><th className={TH}>Bookings</th><th className={TH}>Joined</th></tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className={TROW}>
                <td className={TD}>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-console-muted">{cityByCode(c.city)?.name ?? "No city"}</p>
                </td>
                <td className={TD}>{c.users.map((u) => <p key={u.email ?? u.name}>{u.name}<span className="block text-xs text-console-muted">{u.email}</span></p>)}</td>
                <td className={TD}>{c._count.shipments}</td>
                <td className={TD}>{bookingCount.get(c.id) ?? 0}</td>
                <td className={TD}>{c.createdAt.toISOString().slice(0, 10)} {c.id.startsWith("demo-") && <Pill>demo</Pill>}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}
