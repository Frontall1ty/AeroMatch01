"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateProfile } from "@/app/auth-actions";
import { CITIES } from "@/lib/constants";
import { Field } from "./Field";

export type ProfileValues = { city: string; phone: string; address: string; taxId: string; website: string; about: string };

export function ProfileForm({ initial }: { initial: ProfileValues }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const set = <K extends keyof ProfileValues>(k: K, val: ProfileValues[K]) => {
    setSaved(false);
    setV((p) => ({ ...p, [k]: val }));
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError("");
    setSaved(false);
    start(async () => {
      const result = await updateProfile(v);
      if (!result.ok) {
        setFormError(result.error);
        setErrors(result.fieldErrors ?? {});
      } else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} noValidate className="panel p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="city" label="City" error={errors.city}>
          <select id="city" value={v.city} onChange={(e) => set("city", e.target.value)} aria-invalid={!!errors.city}>
            <option value="">Choose a city</option>
            {CITIES.map((c) => <option key={c.code} value={c.code}>{c.name}, {c.country}</option>)}
          </select>
        </Field>
        <Field id="phone" label="Phone number" error={errors.phone}>
          <input id="phone" type="tel" autoComplete="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} aria-invalid={!!errors.phone} />
        </Field>
        <Field id="address" label="Company address" error={errors.address} className="sm:col-span-2">
          <input id="address" autoComplete="street-address" value={v.address} onChange={(e) => set("address", e.target.value)} aria-invalid={!!errors.address} />
        </Field>
        <Field id="taxId" label="Tax ID" error={errors.taxId} hint="Your company registration or tax number.">
          <input id="taxId" value={v.taxId} onChange={(e) => set("taxId", e.target.value)} aria-invalid={!!errors.taxId} />
        </Field>
        <Field id="website" label="Website (optional)" error={errors.website}>
          <input id="website" type="url" inputMode="url" placeholder="https://" value={v.website} onChange={(e) => set("website", e.target.value)} aria-invalid={!!errors.website} />
        </Field>
        <Field id="about" label="About your company (optional)" error={errors.about} className="sm:col-span-2">
          <textarea id="about" rows={3} maxLength={500} value={v.about} onChange={(e) => set("about", e.target.value)} />
        </Field>
      </div>
      {formError && <p role="alert" className="mt-4 rounded border border-bad px-3 py-2 text-sm font-medium text-bad">{formError}</p>}
      <div className="mt-5 flex items-center gap-3">
        <button className="btn" disabled={pending}>{pending ? "Saving..." : "Save profile"}</button>
        {saved && <span role="status" className="text-sm font-semibold text-good">Saved.</span>}
      </div>
    </form>
  );
}
