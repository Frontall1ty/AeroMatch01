import { redirect } from "next/navigation";
import { LoginForm } from "@/components/AuthForms";
import { getSession, homeFor } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = { title: "Log in: AeroMatch" };

export default async function Login() {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-5 text-[32px] font-bold leading-tight">Log in</h1>
      <LoginForm />
    </div>
  );
}
