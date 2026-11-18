"use client";

import { useRef } from "react";
import { switchCarrierCompany } from "@/app/actions";

export function CarrierSelect({
  companies,
  currentId,
}: {
  companies: { id: string; name: string; verified: boolean }[];
  currentId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={switchCarrierCompany} className="flex items-center gap-2">
      <label htmlFor="carrier-company" className="text-xs font-semibold text-muted">
        Acting as
      </label>
      <select
        id="carrier-company"
        name="companyId"
        defaultValue={currentId}
        onChange={() => formRef.current?.requestSubmit()}
        className="!min-h-[36px] !w-auto !py-1 text-sm"
      >
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {c.verified ? "" : " (unverified)"}
          </option>
        ))}
      </select>
      <noscript>
        <button className="btn-secondary">Switch</button>
      </noscript>
    </form>
  );
}
