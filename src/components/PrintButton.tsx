"use client";

/** Prints the page. The header, footer and buttons are hidden on paper. */
export function PrintButton({ label = "Print summary" }: { label?: string }) {
  return (
    <button type="button" className="btn-secondary print:hidden" onClick={() => window.print()}>
      {label}
    </button>
  );
}
