import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/AuthForms";
import { getSession, homeFor } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign up: AeroMatch" };

export default async function Register() {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-[32px] font-bold leading-tight">Create your account</h1>
      <p className="mb-5 mt-2 text-muted">Shippers compare options and book. Carriers add capacity and handle requests.</p>
      <RegisterForm />
    </div>
  );
}
