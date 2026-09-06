import assert from "node:assert/strict"
import test from "node:test"
import { netSavings } from "./draw-logic"

test("netSavings includes late contributions recorded after a draw", () => {
  // Saldo awal 100000, 9 rumah bayar sebelum kocok (45000), 1 rumah telat
  // bayar 5000 setelah kocok -> total iuran riil 50000, payout 135000.
  const result = netSavings(100000, 50000, 135000)

  assert.equal(result, 15000)
})

test("netSavings is negative when payout exceeds income plus initial save", () => {
  const result = netSavings(100000, 45000, 135000)

  assert.equal(result, 10000)
})
