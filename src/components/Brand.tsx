import Link from "next/link";

/** The AeroMatch mark: an arc between two points on an orange tile, and the name in Cal Sans. */
export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 text-console-text" aria-label="AeroMatch, home">
      <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden fill="none">
        <rect width="28" height="28" rx="6" fill="#FF5B1F" />
        <path d="M6.5 19.5 C 9.5 9, 18 8, 21.5 14.5" stroke="#0E0E10" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="21.5" cy="14.5" r="2.7" fill="#0E0E10" />
        <circle cx="6.5" cy="19.5" r="2" fill="#0E0E10" />
      </svg>
      <span className="font-display text-[20px] tracking-[-0.03em]">AeroMatch</span>
    </Link>
  );
}
