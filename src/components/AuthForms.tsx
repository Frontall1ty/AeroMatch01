"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { loginAccount, registerAccount } from "@/app/auth-actions";
import { CountryCitySelect } from "./CitySelect";
import { Field } from "./Field";

export function LoginForm() {
  const [v, setV] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError("");
    start(async () => {
      const result = await loginAccount(v); // a successful login redirects
      if (result && !result.ok) {
        setFormError(result.error);
        setErrors(result.fieldErrors ?? {});
      }
    });
  }

  return (
    <form onSubmit={submit} noValidate className="panel space-y-4 p-5">
      <Field id="email" label="Email" error={errors.email}>
        <input id="email" type="email" autoComplete="email" inputMode="email" value={v.email} onChange={(e) => setV((p) => ({ ...p, email: e.target.value }))} aria-invalid={!!errors.email} />
      </Field>
      <Field id="password" label="Password" error={errors.password}>
        <input id="password" type="password" autoComplete="current-password" value={v.password} onChange={(e) => setV((p) => ({ ...p, password: e.target.value }))} aria-invalid={!!errors.password} />
      </Field>
      {formError && !errors.email && !errors.password && (
        <p role="alert" className="rounded border border-bad px-3 py-2 text-sm font-medium text-bad">{formError}</p>
      )}
      <button className="btn w-full" disabled={pending}>{pending ? "Logging in..." : "Log in"}</button>
      <p className="text-sm text-muted">
        New here? <Link href="/register" className="font-semibold text-ink underline underline-offset-2">Sign up</Link>.{" "}
        Just looking? <Link href="/demo" className="font-semibold text-ink underline underline-offset-2">Use a demo account</Link>.
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [v, setV] = useState({ role: "SHIPPER" as "SHIPPER" | "CARRIER", name: "", companyName: "", city: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [pending, start] = useTransition();
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((p) => ({ ...p, [k]: val }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError("");
    start(async () => {
      const result = await registerAccount(v); // a successful sign-up redirects
      if (result && !result.ok) {
        setFormError(result.error);
        setErrors(result.fieldErrors ?? {});
      }
    });
  }

  const roleCard = (role: "SHIPPER" | "CARRIER", title: string, text: string) => (
    <label
      className={`flex cursor-pointer flex-col rounded border px-4 py-3 ${v.role === role ? "border-ink ring-1 ring-ink" : "border-rule hover:border-ink"} focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-air`}
    >
      <input type="radio" name="role" className="sr-only" checked={v.role === role} onChange={() => set("role", role)} />
      <span className="font-semibold">{title}</span>
      <span className="mt-0.5 text-sm text-muted">{text}</span>
    </label>
  );

  return (
    <form onSubmit={submit} noValidate className="panel space-y-5 p-5">
      <fieldset>
        <legend className="field-label">I am a</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {roleCard("SHIPPER", "Shipper", "I have cargo to send.")}
          {roleCard("CARRIER", "Carrier", "I have flights, trucks, wagons or vessels with space.")}
        </div>
        {errors.role && <p className="field-error" role="alert">{errors.role}</p>}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label="Your name" error={errors.name}>
          <input id="name" autoComplete="name" value={v.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} />
        </Field>
        <Field id="companyName" label="Company name" error={errors.companyName}>
          <input id="companyName" autoComplete="organization" value={v.companyName} onChange={(e) => set("companyName", e.target.value)} aria-invalid={!!errors.companyName} />
        </Field>
        <CountryCitySelect value={v.city} onChange={(code) => set("city", code)} error={errors.city} />
        <Field id="email" label="Email" error={errors.email}>
          <input id="email" type="email" autoComplete="email" inputMode="email" value={v.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} />
        </Field>
        <Field id="password" label="Password" error={errors.password} hint="At least 10 characters." className="sm:col-span-2">
          <input id="password" type="password" autoComplete="new-password" value={v.password} onChange={(e) => set("password", e.target.value)} aria-invalid={!!errors.password} className="sm:max-w-[50%]" />
        </Field>
      </div>

      {v.role === "CARRIER" && (
        <p className="rounded border border-rule bg-paper px-3 py-2 text-sm">
          You can add capacity right away. Shippers see your offers once our team has verified your company. Fill in your company profile or complete 3 shipments and we will verify you.
        </p>
      )}

      {formError && (
        <p role="alert" className="rounded border border-bad px-3 py-2 text-sm font-medium text-bad">{formError}</p>
      )}
      <button className="btn w-full" disabled={pending}>{pending ? "Creating account..." : "Create account"}</button>
      <p className="text-sm text-muted">
        Already have an account? <Link href="/login" className="font-semibold text-ink underline underline-offset-2">Log in</Link>.
      </p>
    </form>
  );
}
