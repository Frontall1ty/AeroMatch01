import Link from "next/link";
import { adminLogout } from "@/app/auth-actions";
import { AdminNav } from "@/components/admin/AdminNav";
import { Brand } from "@/components/Brand";
import { DemoBadge } from "@/components/ui";
import { waitingCarrierCount } from "@/lib/adminData";
import { isAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = { title: "AeroMatch admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  const waiting = admin ? await waitingCarrierCount() : 0;
  return (
    <div className="on-dark aurora min-h-screen bg-console bg-fixed text-console-text">
      <header className="border-b border-console-rule">
        <div className="mx-auto flex max-w-[1280px] items-center gap-4 px-4 py-2.5">
          <Brand href={admin ? "/admin" : "/"} />
          <span className="rounded border border-console-rule px-2 py-0.5 text-sm font-semibold text-console-muted">Admin console</span>
          <DemoBadge dark className="hidden sm:inline-block" />
          <div className="ml-auto flex items-center gap-3">
            <Link href="/" className="hidden text-sm font-semibold text-console-muted hover:text-white sm:block">View site</Link>
            {admin && (
              <form action={adminLogout}>
                <button className="btn-ghost !min-h-[36px] !px-3">Log out of admin</button>
              </form>
            )}
          </div>
        </div>
      </header>
      {admin ? (
        <div className="mx-auto grid max-w-[1280px] grid-cols-[minmax(0,1fr)] gap-6 px-4 py-6 md:grid-cols-[200px_minmax(0,1fr)]">
          <aside className="min-w-0 md:sticky md:top-6 md:self-start">
            <AdminNav waiting={waiting} />
          </aside>
          <main id="main" className="min-w-0">{children}</main>
        </div>
      ) : (
        <main id="main" className="mx-auto max-w-[1280px] px-4 py-10">{children}</main>
      )}
    </div>
  );
}
