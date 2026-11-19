import { DataTable, Empty, FilterChips, PageHead, Pill, SearchForm, TD, THEAD, TH, TROW } from "@/components/admin/AdminUI";
import { SuspendButton, VerifyButton } from "@/components/AdminControls";
import { deliveredByCarrier } from "@/lib/adminData";
import { cleanQuery, pickFilter } from "@/lib/adminUtils";
import { cityByCode } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { verificationSummary } from "@/lib/verification";

export const dynamic = "force-dynamic";

const FILTERS = ["all", "waiting", "verified", "not-yet", "suspended"] as const;
const LIMIT = 150;

export default async function Carriers({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = pickFilter(sp.filter, FILTERS);
  const q = cleanQuery(sp.q);

  const [companies, delivered] = await Promise.all([
    prisma.company.findMany({
      where: {
        type: { not: "SHIPPER" },
        ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { users: { some: { email: { contains: q, mode: "insensitive" as const } } } }] } : {}),
      },
      include: { users: { select: { name: true, email: true } } },
      orderBy: [{ verified: "asc" }, { createdAt: "desc" }],
    }),
    deliveredByCarrier(),
  ]);

  const rows = companies.map((c) => ({ c, s: verificationSummary(c, delivered.get(c.id) ?? 0) }));
  const waiting = (x: (typeof rows)[number]) => !x.c.verified && !x.c.suspendedAt && x.s.eligible;
  const counts = {
    all: rows.length,
    waiting: rows.filter(waiting).length,
    verified: rows.filter((x) => x.c.verified).length,
    "not-yet": rows.filter((x) => !x.c.verified && !x.s.eligible).length,
    suspended: rows.filter((x) => x.c.suspendedAt).length,
  };
  const shown = rows
    .filter((x) => (filter === "all" ? true : filter === "waiting" ? waiting(x) : filter === "verified" ? x.c.verified : filter === "suspended" ? Boolean(x.c.suspendedAt) : !x.c.verified && !x.s.eligible))
    .slice(0, LIMIT);

  return (
    <div>
      <PageHead title="Carriers">
        Shippers only see verified carriers. Check the company is real before you verify it: look at the phone, address and tax ID, or at its delivered shipments. A suspended carrier is hidden from shippers and cannot add capacity.
      </PageHead>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          basePath="/admin/carriers"
          param="filter"
          current={filter}
          keep={{ q }}
          options={[
            { value: "all", label: "All", count: counts.all },
            { value: "waiting", label: "Waiting for review", count: counts.waiting },
            { value: "verified", label: "Verified", count: counts.verified },
            { value: "not-yet", label: "Not yet", count: counts["not-yet"] },
            { value: "suspended", label: "Suspended", count: counts.suspended },
          ]}
        />
        <SearchForm action="/admin/carriers" q={q} placeholder="Company or email" keep={{ filter: filter === "all" ? "" : filter }} />
      </div>

      {shown.length === 0 ? (
        <Empty>No carriers match. {q ? "Try a shorter search." : "Change the filter above."}</Empty>
      ) : (
        <DataTable minWidth={980}>
          <thead className={THEAD}>
            <tr>
              <th className={TH}>Company</th><th className={TH}>Contact</th><th className={TH}>Profile</th><th className={TH}>Delivered</th><th className={TH}>Status</th>
              <th className={TH}><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {shown.map(({ c, s }) => {
              const city = cityByCode(c.city);
              return (
                <tr key={c.id} className={TROW}>
                  <td className={TD}>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-console-muted">{c.type.toLowerCase()}{city ? `, ${city.name}` : ""}{c.id.startsWith("demo-") ? ", demo" : ""}</p>
                    <p className="text-xs text-console-muted">Joined {c.createdAt.toISOString().slice(0, 10)}</p>
                  </td>
                  <td className={TD}>
                    {c.users.map((u) => <p key={u.email ?? u.name}>{u.name}<span className="block text-xs text-console-muted">{u.email}</span></p>)}
                    {c.phone && <p className="text-xs text-console-muted">{c.phone}</p>}
                  </td>
                  <td className={TD}>
                    {s.profileComplete ? <Pill tone="good">Complete</Pill> : <span className="text-console-muted">Missing: {s.missing.join(", ").toLowerCase()}</span>}
                    {c.address && <p className="mt-1 text-xs text-console-muted">{c.address}</p>}
                    {c.taxId && <p className="text-xs text-console-muted">Tax ID {c.taxId}</p>}
                  </td>
                  <td className={TD}>{s.deliveredCount} of {s.deliveredNeeded}</td>
                  <td className={TD}>
                    <div className="flex flex-wrap gap-1.5">
                      {c.suspendedAt && <Pill tone="bad">Suspended</Pill>}
                      {s.verified ? <Pill tone="good">Verified</Pill> : s.eligible ? <Pill tone="warn">Qualifies</Pill> : <Pill>Not yet</Pill>}
                    </div>
                  </td>
                  <td className={TD}>
                    <div className="flex flex-wrap items-start gap-2">
                      <VerifyButton companyId={c.id} verified={s.verified} />
                      <SuspendButton companyId={c.id} suspended={Boolean(c.suspendedAt)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}
      {rows.length > LIMIT && filter === "all" && <p className="mt-3 text-sm text-console-muted">Showing the first {LIMIT}. Use the search to find others.</p>}
    </div>
  );
}
