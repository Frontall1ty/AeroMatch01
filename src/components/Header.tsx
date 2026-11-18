import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { logout } from "@/app/auth-actions";
import { DemoBadge } from "./ui";

export async function Header() {
  const session = await getSession();

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
          {session ? (
            <>
              {session.role === "CARRIER" && !session.verified && (
                <Link href="/account" className="rounded border border-road px-2 py-1 text-xs font-semibold text-road hover:bg-paper">
                  Not verified yet
                </Link>
              )}
              <Link href="/account" className="max-w-[220px] truncate text-sm hover:underline" title={`${session.name}, ${session.companyName}`}>
                <span className="font-semibold">{session.name}</span>
                <span className="text-muted"> · {session.companyName}</span>
              </Link>
              {session.isDemo && (
                <Link href="/demo" className="text-sm font-semibold underline underline-offset-2 hover:no-underline">
                  Switch demo account
                </Link>
              )}
              <form action={logout}>
                <button className="btn-secondary !min-h-[36px] !px-3">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary !min-h-[36px] !px-3">Log in</Link>
              <Link href="/register" className="btn !min-h-[36px] !px-3">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
