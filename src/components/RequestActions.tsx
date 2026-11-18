"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { approveBooking, rejectBooking } from "@/app/actions";

export function RequestActions({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function run(fn: () => ReturnType<typeof approveBooking>) {
    setError("");
    start(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {!rejecting ? (
        <div className="flex flex-wrap gap-2">
          <button className="btn" disabled={pending} onClick={() => run(() => approveBooking({ bookingId }))}>
            {pending ? "Working..." : "Approve"}
          </button>
          <button className="btn-danger" disabled={pending} onClick={() => setRejecting(true)}>Reject</button>
        </div>
      ) : (
        <div className="space-y-2">
          <label htmlFor={`reason-${bookingId}`} className="field-label">Reason for the shipper (optional)</label>
          <input id={`reason-${bookingId}`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder="For example: truck is full on that date" />
          <div className="flex flex-wrap gap-2">
            <button className="btn-danger" disabled={pending} onClick={() => run(() => rejectBooking({ bookingId, reason }))}>
              {pending ? "Working..." : "Reject"}
            </button>
            <button className="btn-secondary" disabled={pending} onClick={() => setRejecting(false)}>Cancel</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="text-sm font-medium text-bad">{error}</p>}
    </div>
  );
}
