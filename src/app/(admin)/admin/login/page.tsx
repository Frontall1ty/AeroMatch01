import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminControls";
import { adminEnabled, isAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLogin() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 text-2xl font-bold">Admin</h1>
      {adminEnabled() ? (
        <AdminLoginForm />
      ) : (
        <p className="rounded border border-rule bg-panel p-4 text-sm text-muted">
          Admin is switched off. Set <code>ADMIN_PASSCODE</code> in the environment variables and redeploy to turn it on.
        </p>
      )}
    </div>
  );
}
