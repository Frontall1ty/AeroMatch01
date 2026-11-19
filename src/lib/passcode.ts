/**
 * Passcodes are compared after cleaning both sides, so a stray space, a line break or a pair of quotes pasted into
 * the Vercel field does not lock people out. Used by the site gate and the admin login.
 */
export function normalizePasscode(value: string | undefined | null): string {
  let s = (value ?? "").normalize("NFKC").trim();
  if (s.length >= 2 && ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))) s = s.slice(1, -1).trim();
  return s;
}
