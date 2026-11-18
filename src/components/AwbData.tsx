"use client";

import { useState } from "react";

export function AwbData({ json }: { json: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <details className="panel p-4">
      <summary className="cursor-pointer text-sm font-semibold">Air waybill data (illustrative)</summary>
      <p className="mt-2 text-xs text-muted">
        The fields an air waybill needs, taken from this booking. Illustrative only: AeroMatch is not connected to any cargo system.
      </p>
      <pre tabIndex={0} className="mt-3 max-h-72 overflow-auto rounded border border-rule bg-paper p-3 text-xs">{json}</pre>
      <button
        type="button"
        className="btn-secondary mt-3"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(json);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            /* clipboard blocked: the text above can still be selected */
          }
        }}
      >
        {copied ? "Copied" : "Copy data"}
      </button>
    </details>
  );
}
