import Link from "next/link";
import "@/app/story.css";
import { Brand } from "@/components/Brand";
import { DemoBadge } from "@/components/ui";
import { getSession, homeFor } from "@/lib/session";

const NAV = [
  { href: "/#ways", label: "Four ways" },
  { href: "/#cargo", label: "One entry" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#space", label: "Free space" },
  { href: "/#capacity", label: "Capacity" },
  { href: "/#local", label: "Documents" },
  { href: "/#systems", label: "Integration" },
];

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-panel focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="on-dark sticky top-0 z-30 border-b border-console-rule bg-console/80 text-console-text backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-[1180px] items-center gap-6 px-4 py-2.5">
          <Brand />
          <nav aria-label="Sections" className="hidden items-center gap-5 md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="py-1.5 text-sm font-semibold text-console-text hover:text-ion-bright">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="hidden lg:block"><DemoBadge dark /></span>
            {session ? (
              <Link href={homeFor(session.role)} className="btn-bright !min-h-[40px]">Open the app</Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost !min-h-[40px] !px-3 sm:!px-4">Log in</Link>
                <Link href="/register" className="btn-bright !min-h-[40px] !px-3 sm:!px-4">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main id="main">{children}</main>
      <footer className="on-dark border-t border-console-rule bg-console text-console-muted">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm">
          <p>AeroMatch demo. All prices, carriers and capacities are invented. No carrier is connected.</p>
          <Link href="/demo" className="font-semibold text-console-text underline underline-offset-2 hover:text-ion-bright">
            Try a demo account
          </Link>
        </div>
      </footer>
    </>
  );
}
