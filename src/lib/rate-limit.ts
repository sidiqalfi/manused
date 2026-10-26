/**
 * Rate limiter in-memory sederhana (fixed window) untuk server actions.
 * Cukup untuk deployment single-instance; kalau nanti jalan multi-instance,
 * ganti ke penyimpanan bersama (Redis dsb.).
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

// Cegah kebocoran memori: buang bucket kedaluwarsa saat map membesar.
function sweep(now: number) {
  if (buckets.size < 1000) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { ok: boolean; retryAfterSeconds?: number } {
  const now = Date.now()
  sweep(now)

  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    }
  }

  bucket.count += 1
  return { ok: true }
}
