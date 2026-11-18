import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { switchRole } from "@/app/actions";
import { CarrierSelect } from "./CarrierSelect";
import { DemoBadge } from "./ui";

export async function Header() {
  const session = await getSession();

  const carriers =
    session?.role === "CARRIER"
      ? await prisma.company.findMany({
          where: { type: { not: "SHIPPER" } },
          orderBy: { name: "asc" },
          select: { id: true, name: true, verified: true },
        })
      : [];
  const pending =
    session?.role === "CARRIER"
      ? await prisma.booking.count({ where: { status: "REQUESTED", listing: { carrierCompanyId: session.companyId } } })
      : 0;

  const nav =
    session?.role === "SHIPPER"
      ? [
          { href: "/shipper/new", label: "New shipment" },
          { href: "/shipper/bookings", label: "My bookings" },
        ]
      : session?.role === "CARRIER"
        ? [
            { href: "/carrier/capacity/new", label: "Add capacity" },
            { href: "/carrier/requests", label: "Requests", badge: pending },
            { href: "/carrier/bookings", label: "Active bookings" },
          ]
        : [];

  const roleBtn = (role: "SHIPPER" | "CARRIER", label: string) => {
    const active = session?.role === role;
    return (
      <form action={switchRole.bind(null, role, undefined)}>
        <button
          type="submit"
          aria-pressed={active}
          className={`min-h-[36px] px-3 text-sm font-semibold ${
            active ? "bg-ink text-white" : "bg-panel text-ink hover:bg-paper"
          }`}
        >
          {label}
        </button>
      </form>
    );
  };

  return (
    <header className="border-b border-rule bg-panel">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
        <Link href="/" className="condensed text-xl font-bold tracking-tight">
          AeroMatch
        </Link>
        <nav aria-label="Main" className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="min-h-[36px] py-1.5 text-sm font-semibold text-ink hover:underline">
              {n.label}
              {"badge" in n && n.badge ? (
                <span className="ml-1.5 rounded bg-ink px-1.5 py-0.5 text-xs text-white">{n.badge}</span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <DemoBadge />
          {session?.role === "CARRIER" && <CarrierSelect companies={carriers} currentId={session.companyId} />}
          <div role="group" aria-label="Demo role" className="flex overflow-hidden rounded border border-rule">
            {roleBtn("SHIPPER", "Shipper")}
            {roleBtn("CARRIER", "Carrier")}
          </div>
        </div>
      </div>
    </header>
  );
}
