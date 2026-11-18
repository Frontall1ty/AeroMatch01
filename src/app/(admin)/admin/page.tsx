import { prisma } from "@/lib/db";
import { cityByCode } from "@/lib/constants";
import { requireAdmin } from "@/lib/session";
import { verificationSummary } from "@/lib/verification";
import { VerifyButton } from "@/components/AdminControls";

export const dynamic = "force-dynamic";

export default async function Admin() {
  await requireAdmin();

  const companies = await prisma.company.findMany({
    where: { type: { not: "SHIPPER" } },
    include: { users: { select: { name: true, email: true } } },
    orderBy: [{ verified: "asc" }, { createdAt: "desc" }],
  });
  const delivered = await Promise.all(
    companies.map((c) => prisma.booking.count({ where: { status: "DELIVERED", listing: { carrierCompanyId: c.id } } })),
  );

  const waiting = companies.filter((c, i) => !c.verified && verificationSummary(c, delivered[i]).eligible).length;

  return (
    <div>
      <h1 className="text-2xl font-bold">Verify carriers</h1>
      <p className="mt-2 max-w-[70ch] text-muted">
        Shippers only see verified carriers. Check the company is real before you verify it: look at the phone, address and tax ID, or at its delivered shipments.
        {waiting > 0 && <span className="font-semibold text-ink"> {waiting} {waiting === 1 ? "company qualifies" : "companies qualify"} now.</span>}
      </p>

      <div className="panel mt-5 overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-rule text-xs text-muted">
            <tr>
              <th className="p-3 font-semibold">Company</th>
              <th className="p-3 font-semibold">Contact</th>
              <th className="p-3 font-semibold">Profile</th>
              <th className="p-3 font-semibold">Delivered</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3"><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c, i) => {
              const s = verificationSummary(c, delivered[i]);
              const city = cityByCode(c.city);
              return (
                <tr key={c.id} className="border-b border-rule align-top last:border-0">
                  <td className="p-3">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-muted">{c.type.toLowerCase()}{city ? `, ${city.name}` : ""}{c.id.startsWith("demo-") ? ", demo" : ""}</p>
                  </td>
                  <td className="p-3">
                    {c.users.map((u) => (
                      <p key={u.email ?? u.name}>{u.name}<span className="block text-xs text-muted">{u.email}</span></p>
                    ))}
                    {c.phone && <p className="text-xs text-muted">{c.phone}</p>}
                  </td>
                  <td className="p-3">
                    {s.profileComplete ? <span className="font-semibold text-good">Complete</span> : <span className="text-muted">Missing: {s.missing.join(", ").toLowerCase()}</span>}
                    {c.address && <p className="text-xs text-muted">{c.address}</p>}
                    {c.taxId && <p className="text-xs text-muted">Tax ID {c.taxId}</p>}
                  </td>
                  <td className="p-3">{s.deliveredCount} of {s.deliveredNeeded}</td>
                  <td className="p-3">
                    {s.verified ? (
                      <span className="rounded border border-good px-2 py-0.5 text-xs font-semibold text-good">Verified</span>
                    ) : s.eligible ? (
                      <span className="rounded border border-road px-2 py-0.5 text-xs font-semibold text-road">Qualifies</span>
                    ) : (
                      <span className="text-xs text-muted">Not yet</span>
                    )}
                  </td>
                  <td className="p-3"><VerifyButton companyId={c.id} verified={s.verified} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
