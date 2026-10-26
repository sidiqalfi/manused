import assert from "node:assert/strict"
import { test } from "node:test"

test("rateLimit: izinkan sampai limit, tolak setelahnya, reset setelah window", async () => {
  const { rateLimit } = await import("./rate-limit")

  // Key unik agar terisolasi dari run lain.
  const key = `test-${Date.now()}-${Math.random()}`
  const opts = { limit: 3, windowMs: 50 }

  assert.equal(rateLimit(key, opts).ok, true)
  assert.equal(rateLimit(key, opts).ok, true)
  assert.equal(rateLimit(key, opts).ok, true)

  const blocked = rateLimit(key, opts)
  assert.equal(blocked.ok, false)
  assert.equal(typeof blocked.retryAfterSeconds, "number")

  // Tunggu window lewat → boleh lagi.
  await new Promise((r) => setTimeout(r, 60))
  assert.equal(rateLimit(key, opts).ok, true)
})

test("rateLimit: key berbeda tidak saling mempengaruhi", async () => {
  const { rateLimit } = await import("./rate-limit")

  const base = `isol-${Date.now()}-${Math.random()}`
  const opts = { limit: 1, windowMs: 10_000 }

  assert.equal(rateLimit(`${base}-a`, opts).ok, true)
  assert.equal(rateLimit(`${base}-a`, opts).ok, false)
  assert.equal(rateLimit(`${base}-b`, opts).ok, true)
})
