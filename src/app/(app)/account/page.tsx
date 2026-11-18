import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { verificationSummary } from "@/lib/verification";
import { ProfileForm } from "@/components/ProfileForm";
import { PageTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Account({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const session = await requireSession();
  const { welcome } = await searchParams;

  const company = await prisma.company.findUniqueOrThrow({ where: { id: session.companyId } });
  const carrier = session.role === "CARRIER";
  const delivered = carrier
    ? await prisma.booking.count({ where: { status: "DELIVERED", listing: { carrierCompanyId: company.id } } })
    : 0;
  const v = verificationSummary(company, delivered);

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="Your account">
        <span className="text-sm text-muted">{session.name} · {session.email}</span>
      </PageTitle>

      {welcome && carrier && (
        <p role="status" className="mb-4 rounded border border-good px-3 py-2 text-sm font-medium text-good">
          Account created. You can add capacity now. Complete the profile below so we can verify {company.name}.
        </p>
      )}

      {carrier && (
        <section className="panel mb-6 p-5" aria-labelledby="verification">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="verification" className="text-xl font-semibold">Verification</h2>
            <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${v.verified ? "border-good text-good" : "border-road text-road"}`}>
              {v.verified ? "Verified" : "Not verified yet"}
            </span>
          </div>
          {v.verified ? (
            <p className="mt-2 text-sm text-muted">Shippers can see your offers and they carry the Verified badge.</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted">
                Shippers do not see your offers until our team verifies {company.name}. We verify by hand, to keep fraud out. Either of these is enough:
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex gap-2">
                  <span aria-hidden className={v.profileComplete ? "text-good" : "text-muted"}>{v.profileComplete ? "✓" : "○"}</span>
                  <span>
                    <span className="font-semibold">Complete company profile.</span>{" "}
                    {v.profileComplete ? "Done." : `Still missing: ${v.missing.join(", ").toLowerCase()}.`}
                  </span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden className={v.deliveredCount >= v.deliveredNeeded ? "text-good" : "text-muted"}>{v.deliveredCount >= v.deliveredNeeded ? "✓" : "○"}</span>
                  <span>
                    <span className="font-semibold">{v.deliveredNeeded} completed shipments.</span> {v.deliveredCount} of {v.deliveredNeeded} delivered.
                  </span>
                </li>
              </ul>
              {v.eligible && <p className="mt-3 text-sm font-semibold">You qualify. Our team will verify you soon.</p>}
            </>
          )}
        </section>
      )}

      <h2 className="mb-3 text-xl font-semibold">Company profile</h2>
      <ProfileForm
        initial={{
          city: company.city ?? "",
          phone: company.phone ?? "",
          address: company.address ?? "",
          taxId: company.taxId ?? "",
          website: company.website ?? "",
          about: company.about ?? "",
        }}
      />
    </div>
  );
}
