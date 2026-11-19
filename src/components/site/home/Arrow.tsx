/** A small arrow for calls to action. It slides on hover; screen readers skip it. */
export function Arrow() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" width="16" height="16" className="btn-arrow shrink-0" fill="none">
      <path d="M3 8 H12.5 M8.5 4 L12.5 8 L8.5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
