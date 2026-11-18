import Link from "next/link";
import { adminLogout } from "@/app/auth-actions";
import { isAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  return (
    <>
      <header className="border-b border-rule bg-panel">
        <div className="mx-auto flex max-w-[1180px] items-center gap-6 px-4 py-2.5">
          <Link href="/" className="condensed text-xl font-bold tracking-tight">AeroMatch</Link>
          <span className="text-sm font-semibold">Admin</span>
          {admin && (
            <form action={adminLogout} className="ml-auto">
              <button className="btn-secondary !min-h-[36px] !px-3">Log out of admin</button>
            </form>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-4 py-8">{children}</main>
    </>
  );
}
