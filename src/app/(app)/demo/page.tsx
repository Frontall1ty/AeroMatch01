import Link from "next/link";
import { prisma } from "@/lib/db";
import { DEMO_EMAIL_SUFFIX } from "@/lib/accountSchemas";
import { demoLogin } from "@/app/auth-actions";
import { DemoBadge, PageTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DemoAccounts() {
  if (process.env.ALLOW_DEMO_ACCOUNTS === "false") {
    return (
      <div className="mx-auto max-w-2xl">
        <PageTitle title="Demo accounts are switched off" />
        <p className="text-muted">Log in with your own account, or sign up.</p>
        <div className="mt-4 flex gap-3">
          <Link href="/login" className="btn">Log in</Link>
          <Link href="/register" className="btn-secondary">Sign up</Link>
        </div>
      </div>
    );
  }

  const users = await prisma.user.findMany({
    where: { email: { endsWith: DEMO_EMAIL_SUFFIX }, passwordHash: null },
    include: { company: true },
    orderBy: { name: "asc" },
  });
  const shippers = users.filter((u) => u.role === "SHIPPER");
  const carriers = users.filter((u) => u.role === "CARRIER");

  const row = (u: (typeof users)[number]) => (
    <li key={u.id}>
      <form action={demoLogin.bind(null, u.id)}>
        <button className="flex w-full flex-wrap items-center justify-between gap-2 p-4 text-left hover:bg-paper">
          <span>
            <span className="block font-semibold">{u.company.name}</span>
            <span className="text-sm text-muted">{u.company.type === "SHIPPER" ? "Shipper" : u.company.type === "GSA" ? "Cargo agent" : u.company.type === "FORWARDER" ? "Forwarder" : "Carrier"}</span>
          </span>
          {u.role === "CARRIER" && (
            <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${u.company.verified ? "border-good text-good" : "border-road text-road"}`}>
              {u.company.verified ? "Verified" : "Not verified: hidden from shippers"}
            </span>
          )}
        </button>
      </form>
    </li>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title="Demo accounts">
        <DemoBadge />
      </PageTitle>
      <p className="mb-6 text-muted">
        These accounts hold invented data and need no password. Open a shipper and a carrier in two windows to see a booking from both sides.
        For a real account, <Link href="/register" className="font-semibold text-ink underline underline-offset-2">sign up</Link> or{" "}
        <Link href="/login" className="font-semibold text-ink underline underline-offset-2">log in</Link>.
      </p>

      <h2 className="mb-2 text-xl font-semibold">Shipper</h2>
      <ul className="panel divide-y divide-rule">{shippers.map(row)}</ul>

      <h2 className="mb-2 mt-8 text-xl font-semibold">Carriers</h2>
      <ul className="panel divide-y divide-rule">{carriers.map(row)}</ul>
    </div>
  );
}
