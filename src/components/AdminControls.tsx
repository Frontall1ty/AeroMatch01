"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminLogin, setCompanyVerified } from "@/app/auth-actions";
import { adminResetDemoData, setCompanySuspended, setListingStatus } from "@/app/admin-actions";
import type { ActionResult } from "@/lib/validation";
import { Field } from "./Field";

export function AdminLoginForm() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [shown, setShown] = useState(false);
  const [pending, start] = useTransition();
  return (
    <form
      noValidate
      className="panel-dark ticks space-y-4 p-5"
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
        <div className="flex gap-2">
          <input
            id="passcode"
            type={shown ? "text" : "password"}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            aria-invalid={!!error}
            className="!border-console-rule !bg-console !text-console-text"
          />
          <button type="button" className="btn-ghost shrink-0" aria-pressed={shown} onClick={() => setShown((v) => !v)}>{shown ? "Hide" : "Show"}</button>
        </div>
      </Field>
      <button className="btn-bright w-full" disabled={pending}>{pending ? "Checking..." : "Open admin"}</button>
    </form>
  );
}

/** A button that runs one admin action, refreshes the page and shows an error under itself. */
function ActionButton({
  label, busy, run, className = "btn-ghost !min-h-[36px] !px-3", confirm,
}: {
  label: string;
  busy: string;
  run: () => Promise<ActionResult>;
  className?: string;
  /** Ask once more before running. */
  confirm?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [asking, setAsking] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div>
      <button
        className={className}
        disabled={pending}
        onClick={() => {
          if (confirm && !asking) { setAsking(true); return; }
          setAsking(false);
          start(async () => {
            setError("");
            const r = await run();
            if (!r.ok) setError(r.error);
            else router.refresh();
          });
        }}
      >
        {pending ? busy : asking ? confirm : label}
      </button>
      {asking && !pending && <button className="ml-2 text-xs font-semibold text-console-muted underline" onClick={() => setAsking(false)}>Cancel</button>}
      {error && <p role="alert" className="mt-1 max-w-[220px] text-xs font-medium text-[#FCA5A5]">{error}</p>}
    </div>
  );
}

export function VerifyButton({ companyId, verified }: { companyId: string; verified: boolean }) {
  return (
    <ActionButton
      label={verified ? "Remove verification" : "Verify"}
      busy="Saving..."
      className={verified ? "btn-ghost !min-h-[36px] !px-3" : "btn-bright !min-h-[36px] !px-3"}
      run={() => setCompanyVerified({ companyId, verified: !verified })}
    />
  );
}

export function SuspendButton({ companyId, suspended }: { companyId: string; suspended: boolean }) {
  return (
    <ActionButton
      label={suspended ? "Reinstate" : "Suspend"}
      busy="Saving..."
      confirm={suspended ? undefined : "Suspend? Click again"}
      run={() => setCompanySuspended({ companyId, suspended: !suspended })}
    />
  );
}

export function ListingStatusButton({ listingId, status }: { listingId: string; status: string }) {
  const closing = status === "OPEN" || status === "FULL";
  return (
    <ActionButton
      label={closing ? "Close" : "Reopen"}
      busy="Saving..."
      run={() => setListingStatus({ listingId, status: closing ? "CLOSED" : "OPEN" })}
    />
  );
}

export function ResetDemoButton({ disabled }: { disabled: boolean }) {
  if (disabled) return <button className="btn-ghost" disabled>Demo reset is switched off</button>;
  return <ActionButton label="Reset demo data" busy="Reloading..." confirm="Reload demo records? Click again" run={() => adminResetDemoData()} className="btn-ghost" />;
}
