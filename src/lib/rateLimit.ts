/**
 * Small in-memory limiter. On a serverless host each instance has its own memory, so this slows
 * down guessing but is not a guarantee. Use the host's firewall for a hard limit.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

/** Returns true when the action is allowed. */
export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}
