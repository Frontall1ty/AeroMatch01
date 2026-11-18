/**
 * Finds the PostgreSQL connection string, whichever host set it.
 * A direct connection is preferred over a pooled one. Anything that is not a plain
 * postgres:// URL (for example Prisma's prisma+postgres:// proxy address) is skipped.
 *
 * Neon (Vercel integration): DATABASE_URL_UNPOOLED, DATABASE_URL
 * Supabase (Vercel integration): POSTGRES_URL_NON_POOLING, POSTGRES_URL
 * Prisma Postgres (Vercel integration): POSTGRES_URL
 */
const CANDIDATES = ["DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING", "DATABASE_URL", "POSTGRES_URL"] as const;

export function resolveDatabaseUrl(env: Record<string, string | undefined> = process.env): string | undefined {
  for (const name of CANDIDATES) {
    const value = env[name]?.trim();
    if (value && /^postgres(ql)?:\/\//.test(value)) return value;
  }
  return undefined;
}
