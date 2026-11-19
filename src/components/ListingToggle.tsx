"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setOwnListingStatus } from "@/app/actions";

/** Close a listing so shippers stop seeing it, or open it again. */
export function ListingToggle({ listingId, status }: { listingId: string; status: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const closing = status !== "CLOSED";
  return (
    <div>
      <button
        className="btn-secondary !min-h-[40px] !px-3"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError("");
            const r = await setOwnListingStatus({ listingId, status: closing ? "CLOSED" : "OPEN" });
            if (!r.ok) setError(r.error);
            else router.refresh();
          })
        }
      >
        {pending ? "Saving..." : closing ? "Close listing" : "Reopen"}
      </button>
      {error && <p role="alert" className="mt-1 text-xs font-medium text-bad">{error}</p>}
    </div>
  );
}
