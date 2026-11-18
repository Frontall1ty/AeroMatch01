"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminLogin, setCompanyVerified } from "@/app/auth-actions";
import { Field } from "./Field";

export function AdminLoginForm() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      noValidate
      className="panel space-y-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        start(async () => {
          const r = await adminLogin({ passcode });
          if (r && !r.ok) setError(r.fieldErrors?.passcode ?? r.error);
        });
      }}
    >
      <Field id="passcode" label="Admin passcode" error={error}>
        <input id="passcode" type="password" autoComplete="off" value={passcode} onChange={(e) => setPasscode(e.target.value)} aria-invalid={!!error} />
      </Field>
      <button className="btn w-full" disabled={pending}>{pending ? "Checking..." : "Open admin"}</button>
    </form>
  );
}

export function VerifyButton({ companyId, verified }: { companyId: string; verified: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <div>
      <button
        className={verified ? "btn-secondary !min-h-[36px] !px-3" : "btn !min-h-[36px] !px-3"}
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError("");
            const r = await setCompanyVerified({ companyId, verified: !verified });
            if (!r.ok) setError(r.error);
            else router.refresh();
          })
        }
      >
        {pending ? "Saving..." : verified ? "Remove verification" : "Verify"}
      </button>
      {error && <p role="alert" className="mt-1 text-xs font-medium text-bad">{error}</p>}
    </div>
  );
}
