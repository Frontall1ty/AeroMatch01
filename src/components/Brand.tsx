import Link from "next/link";

/** The AeroMatch mark: a route between two nodes, and the name in a wide cut. */
export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5 text-console-text" aria-label="AeroMatch, home">
      <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden fill="none">
        <rect x="0.75" y="0.75" width="26.5" height="26.5" rx="4" stroke="#FFFFFF" strokeWidth="1.5" />
        <path d="M6 19.5 L11.5 12 L15.5 15.5 L21.5 8" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="21.5" cy="8" r="2.4" fill="#FFFFFF" />
        <circle cx="6" cy="19.5" r="1.8" fill="#F2F2F2" />
      </svg>
      <span className="text-[19px] font-semibold tracking-[-0.04em]">AeroMatch<sup className="ml-0.5 text-[9px] font-normal text-console-muted">®</sup></span>
    </Link>
  );
}
