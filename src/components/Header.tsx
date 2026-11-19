import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { logout } from "@/app/auth-actions";
import { Brand } from "./Brand";
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
            { href: "/carrier/capacity", label: "My capacity" },
            { href: "/carrier/requests", label: "Requests", badge: pending },
            { href: "/carrier/bookings", label: "Active bookings" },
          ]
        : [];

  return (
    <header className="on-dark print:hidden border-b border-console-rule bg-console text-console-text">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
        <Brand />
        <nav aria-label="Main" className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="min-h-[36px] py-1.5 text-sm font-semibold text-console-text hover:text-ion-bright">
              {n.label}
              {"badge" in n && n.badge ? (
                <span className="ml-1.5 rounded bg-ion-bright px-1.5 py-0.5 text-xs font-bold text-console">{n.badge}</span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          <DemoBadge dark />
          {session ? (
            <>
              {session.role === "CARRIER" && session.suspended && (
                <Link href="/account" className="rounded border border-[#FCA5A5] px-2 py-1 text-xs font-semibold text-[#FCA5A5] hover:bg-console-raised">
                  Suspended
                </Link>
              )}
              {session.role === "CARRIER" && !session.verified && !session.suspended && (
                <Link href="/account" className="rounded border border-[#FDBA74] px-2 py-1 text-xs font-semibold text-[#FDBA74] hover:bg-console-raised">
                  Not verified yet
                </Link>
              )}
              <Link href="/account" className="max-w-[220px] truncate text-sm hover:text-ion-bright" title={`${session.name}, ${session.companyName}`}>
                <span className="font-semibold">{session.name}</span>
                <span className="text-console-muted"> · {session.companyName}</span>
              </Link>
              {session.isDemo && (
                <Link href="/demo" className="text-sm font-semibold underline underline-offset-2 hover:text-ion-bright">
                  Switch demo account
                </Link>
              )}
              <form action={logout}>
                <button className="btn-ghost !min-h-[36px] !px-3">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost !min-h-[36px] !px-3">Log in</Link>
              <Link href="/register" className="btn-bright !min-h-[36px] !px-3">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
