"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/carriers", label: "Carriers" },
  { href: "/admin/shippers", label: "Shippers" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/activity", label: "Activity" },
  { href: "/admin/system", label: "System" },
];

export function AdminNav({ waiting }: { waiting: number }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {ITEMS.map((i) => {
        const active = i.exact ? path === i.href : path.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-[44px] items-center justify-between gap-3 whitespace-nowrap rounded border px-3 text-sm font-semibold ${active ? "border-ion-bright bg-console-raised text-white" : "border-transparent text-console-muted hover:text-white"}`}
          >
            {i.label}
            {i.href === "/admin/carriers" && waiting > 0 && (
              <span className="rounded bg-[#FCD34D] px-1.5 py-0.5 text-xs font-bold text-console" title="Carriers waiting for review">{waiting}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
