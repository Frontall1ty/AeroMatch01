import Link from "next/link";
import "@/app/site.css";
import { Brand } from "@/components/Brand";
import { DemoBadge } from "@/components/ui";
import { CITIES, COUNTRIES } from "@/lib/places";
import { getSession, homeFor } from "@/lib/session";

const NAV = [
  { href: "/#what", label: "What it does" },
  { href: "/#modes", label: "Four ways" },
  { href: "/#race", label: "Race" },
  { href: "/#carriers", label: "For carriers" },
  { href: "/#faq", label: "Questions" },
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
      <header className="on-dark sticky top-0 z-30 border-b border-white/10 bg-console/85 text-console-text backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-[1320px] items-center gap-6 px-4 py-2.5 md:px-6">
          <Brand />
          <nav aria-label="Sections" className="hidden items-center gap-6 lg:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="nav-link py-1.5 text-sm font-medium text-console-text hover:text-ion-bright">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="hidden xl:block"><DemoBadge dark /></span>
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
      <footer className="on-dark overflow-hidden bg-console text-console-text">
        <div className="col-lines mx-auto max-w-[1320px] px-4 pt-14 md:px-6">
          <div className="grid gap-8 border-t border-console-rule pt-8 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="site-label text-console-muted">AeroMatch</p>
              <p className="mt-3 max-w-[32ch] text-console-muted">Compare air, sea, rail and road from your city, and book the one that fits.</p>
            </div>
            <nav aria-label="Site">
              <p className="site-label text-console-muted">On this page</p>
              <ul className="mt-3 space-y-2">
                {NAV.map((n) => (
                  <li key={n.href}><a href={n.href} className="nav-link hover:text-ion-bright">{n.label}</a></li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Account">
              <p className="site-label text-console-muted">Get started</p>
              <ul className="mt-3 space-y-2">
                <li><Link href="/register" className="nav-link hover:text-ion-bright">Sign up</Link></li>
                <li><Link href="/login" className="nav-link hover:text-ion-bright">Log in</Link></li>
                <li><Link href="/demo" className="nav-link hover:text-ion-bright">Try a demo account</Link></li>
              </ul>
            </nav>
            <div>
              <p className="site-label text-console-muted">Coverage</p>
              <p className="mt-3 text-console-muted">{CITIES.length} cities in {COUNTRIES.length} countries. Pilot origin: Tashkent.</p>
            </div>
          </div>
          <p aria-hidden className="font-display mt-16 select-none whitespace-nowrap text-center text-[19vw] leading-[0.8] tracking-[-0.05em] text-white/[0.92] lg:text-[250px]">
            AeroMatch
          </p>
          <div className="flex flex-wrap justify-between gap-3 border-t border-console-rule py-5 text-xs text-console-muted">
            <p>Demo. All prices, carriers and capacities are invented. No carrier is connected.</p>
            <p>Air, sea, rail and road, compared in one place.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
