/**
 * Passcodes are compared after cleaning both sides, so a stray space, a line break or a pair of quotes pasted into
 * the Vercel field does not lock people out. Used by the site gate and the admin login.
 */
export function normalizePasscode(value: string | undefined | null): string {
  // invisible characters that a copy and paste can bring along: zero-width spaces and joiners, the byte order mark
  let s = (value ?? "").normalize("NFKC").replace(/[\u200B-\u200D\u2060\uFEFF]/g, "").trim();
  if (s.length >= 2 && ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))) s = s.slice(1, -1).trim();
  return s;
}
