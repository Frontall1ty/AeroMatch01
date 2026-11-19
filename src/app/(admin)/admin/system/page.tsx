import Link from "next/link";
import { Card, PageHead, Pill } from "@/components/admin/AdminUI";
import { ResetDemoButton } from "@/components/AdminControls";
import { prisma } from "@/lib/db";
import { int } from "@/lib/format";
import { normalizePasscode } from "@/lib/passcode";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Switches are shown as on or off. Their values, such as passcodes, are never shown. */
const flag = (on: boolean, goodWhenOn: boolean) => <Pill tone={on === goodWhenOn ? "good" : "quiet"}>{on ? "On" : "Off"}</Pill>;

export default async function System() {
  await requireAdmin();

  const t0 = Date.now();
  let dbOk = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbOk = false;
  }
  const ms = Date.now() - t0;

  const [companies, users, listings, shipments, bookings, actions] = await Promise.all([
    prisma.company.count(), prisma.user.count(), prisma.capacityListing.count(), prisma.shipmentRequest.count(), prisma.booking.count(), prisma.adminAction.count(),
  ]);
  const resetOff = process.env.ALLOW_DEMO_RESET === "false";

  return (
    <div className="space-y-5">
      <PageHead title="System">The state of the site and its data, and a few tools. Settings are changed in Vercel, under Environment Variables, followed by a redeploy.</PageHead>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Settings">
          <dl className="divide-y divide-console-rule text-sm">
            {[
              ["Site passcode (the gate before the site)", flag(Boolean(normalizePasscode(process.env.DEMO_PASSCODE)), true), "Set DEMO_PASSCODE. Remove it to open the site to everyone."],
              ["Admin passcode", flag(Boolean(normalizePasscode(process.env.ADMIN_PASSCODE)), true), "ADMIN_PASSCODE. Without it this console is off."],
              ["Sign-up open", flag(process.env.ALLOW_REGISTRATION !== "false", true), "ALLOW_REGISTRATION=false closes sign-up."],
              ["Demo accounts", flag(process.env.ALLOW_DEMO_ACCOUNTS !== "false", true), "ALLOW_DEMO_ACCOUNTS=false hides them."],
              ["Demo reset button", flag(!resetOff, true), "ALLOW_DEMO_RESET=false hides it and blocks the reset."],
            ].map(([name, state, how]) => (
              <div key={String(name)} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 py-3">
                <dt className="font-semibold">{name}</dt>
                <dd className="row-span-2 col-start-2 row-start-1">{state}</dd>
                <dd className="col-start-1 text-xs text-console-muted">{how}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="Database">
          <div className="flex items-center gap-3">
            <Pill tone={dbOk ? "good" : "bad"}>{dbOk ? "Connected" : "Not reachable"}</Pill>
            <span className="text-sm text-console-muted">{dbOk ? `Answered in ${ms} ms` : "Check DATABASE_URL in Vercel."}</span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            {[["Companies", companies], ["Users", users], ["Listings", listings], ["Shipments", shipments], ["Bookings", bookings], ["Admin actions", actions]].map(([k, v]) => (
              <div key={String(k)} className="rounded border border-console-rule p-3">
                <dt className="text-xs text-console-muted">{k}</dt>
                <dd className="condensed text-2xl font-bold">{int(Number(v))}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Export">
          <p className="mb-3 text-sm text-console-muted">Download the records as CSV, to open in a spreadsheet. Text that could run as a spreadsheet formula is made safe.</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/export/companies" prefetch={false} className="btn-ghost">Companies</Link>
            <Link href="/admin/export/listings" prefetch={false} className="btn-ghost">Listings</Link>
            <Link href="/admin/export/bookings" prefetch={false} className="btn-ghost">Bookings</Link>
          </div>
        </Card>
        <Card title="Demo data">
          <p className="mb-3 text-sm text-console-muted">Reloads the invented demo carriers, listings and accounts with fresh dates. Real accounts and their records are not touched.</p>
          <ResetDemoButton disabled={resetOff} />
        </Card>
      </div>
    </div>
  );
}
