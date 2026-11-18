/**
 * Finds the PostgreSQL connection string, whichever host set it and whatever prefix it used.
 * A direct connection is preferred over a pooled one. Anything that is not a plain
 * postgres:// URL (for example Prisma's prisma+postgres:// proxy address) is skipped.
 *
 * Neon (Vercel integration): DATABASE_URL_UNPOOLED, DATABASE_URL
 * Supabase (Vercel integration): POSTGRES_URL_NON_POOLING, POSTGRES_URL
 * Prisma Postgres (Vercel integration): POSTGRES_URL
 * The Vercel integration lets you choose a prefix, so STORAGE_POSTGRES_URL is found too.
 */
const NAMES = ["DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING", "DATABASE_URL", "POSTGRES_URL"] as const;

const isPostgres = (value: string | undefined): value is string => !!value && /^postgres(ql)?:\/\//.test(value.trim());

export function resolveDatabaseUrl(env: Record<string, string | undefined> = process.env): string | undefined {
  for (const name of NAMES) {
    const keys = Object.keys(env)
      .filter((key) => key === name || key.endsWith(`_${name}`))
      .sort((a, b) => (a === name ? -1 : b === name ? 1 : a.localeCompare(b)));
    for (const key of keys) {
      const value = env[key];
      if (isPostgres(value)) return value.trim();
    }
  }
  return undefined;
}
