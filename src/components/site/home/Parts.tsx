import type { ReactNode } from "react";

/** A section head: a numbered label, a large title and a short lead, laid out on the page grid. */
export function SectionHead({ n, label, title, lead, id, dark = false }: { n: string; label: string; title: string; lead?: ReactNode; id: string; dark?: boolean }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14">
      <p className={`site-label ${dark ? "text-console-muted" : "text-muted"}`}>{n} — {label}</p>
      <div>
        <h2 id={id} className="display text-[clamp(44px,5.6vw,88px)]">{title}</h2>
        {lead && <div className={`mt-5 max-w-[60ch] text-lg ${dark ? "text-console-muted" : "text-muted"}`}>{lead}</div>}
      </div>
    </div>
  );
}

const TONES = {
  white: "bg-panel",
  paper: "bg-paper",
  dark: "on-dark bg-console text-console-text",
} as const;

/** A full-width band on the page grid. */
export function Band({ id, tone, labelledBy, children, className = "" }: { id?: string; tone: keyof typeof TONES; labelledBy: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-16 ${TONES[tone]} ${className}`} aria-labelledby={labelledBy}>
      <div className="col-lines mx-auto max-w-[1320px] px-4 py-20 md:px-6 md:py-28">{children}</div>
    </section>
  );
}
