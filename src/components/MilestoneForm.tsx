"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { advanceMilestone } from "@/app/actions";

export function MilestoneForm({ bookingId, nextLabel }: { bookingId: string; nextLabel: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function go() {
    setError("");
    start(async () => {
      const r = await advanceMilestone({ bookingId, note });
      if (!r.ok) setError(r.error);
      else {
        setNote("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      <label htmlFor={`note-${bookingId}`} className="field-label">Note (optional)</label>
      <input id={`note-${bookingId}`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="For example: truck plate 01 A 123 AA" />
      <button className="btn" onClick={go} disabled={pending}>
        {pending ? "Updating..." : `Mark as ${nextLabel.toLowerCase()}`}
      </button>
      {error && <p role="alert" className="text-sm font-medium text-bad">{error}</p>}
    </div>
  );
}
