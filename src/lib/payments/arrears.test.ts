import assert from "node:assert/strict"
import { test } from "node:test"
import { computeArrears, computeMonthlyDeficits } from "./arrears"
import type { ArisanPaymentMatrix } from "@/features/arisan/actions/get-arisan-payment-matrix"

// Skenario matrix dengan anggota adit & budi
function matrixFrom(
  months: ArisanPaymentMatrix["months"]
): ArisanPaymentMatrix {
  return {
    members: [
      { id: "adit", name: "Adit", fullName: "Adit Pratama" },
      { id: "budi", name: "Budi", fullName: "Budi Santoso" },
    ],
    months,
  }
}

test("overpayment in a later month settles an earlier unpaid month (FIFO)", () => {
  // Kasus Adit: Sep tidak bayar (5rb), Okt bayar 10rb (wajib 5rb)
  // => kelebihan 5rb menutup Sep => tidak nunggak
  const matrix = matrixFrom([
    { month: 9, expected: 5000, paidBy: {} },
    { month: 10, expected: 5000, paidBy: { adit: 10000 } },
    { month: 11, expected: 5000, paidBy: {} },
  ])

  const result = computeArrears(matrix, 2026, 0)
  assert.equal(result.get("adit"), undefined)
})

test("simple unpaid past month counts as arrears", () => {
  const matrix = matrixFrom([
    { month: 9, expected: 5000, paidBy: { budi: 5000 } },
    { month: 10, expected: 5000, paidBy: { adit: 5000 } },
  ])

  // "Sekarang" dibekukan 1 Nov 2026 agar test hermetic (tidak pecah
  // saat bulan berjalan berganti).
  const result = computeArrears(matrix, 2026, 0, new Date(2026, 10, 1))
  // Adit bayar Okt saja, Sep kosong => nunggak Sep
  assert.deepEqual(result.get("adit"), { count: 1, amount: 5000 })
  // Budi bayar Sep penuh tapi Okt kosong => nunggak Okt
  assert.deepEqual(result.get("budi"), { count: 1, amount: 5000 })
})

test("partial payment leaves the remainder as arrears", () => {
  // Sep wajib 5rb, Adit bayar 2rb => sisa 3rb nunggak
  const matrix = matrixFrom([
    { month: 9, expected: 5000, paidBy: { adit: 2000 } },
    { month: 10, expected: 5000, paidBy: { adit: 5000 } },
  ])

  const result = computeArrears(matrix, 2026, 0)
  assert.deepEqual(result.get("adit"), { count: 1, amount: 3000 })
})

test("overpayment settles the oldest deficits first", () => {
  // Sep & Okt tanpa bayar (5rb masing-masing), Nov bayar 15rb (wajib 5rb)
  // => 10rb kelebihan menutup Sep + Okt => lunas
  const matrix = matrixFrom([
    { month: 9, expected: 5000, paidBy: {} },
    { month: 10, expected: 5000, paidBy: {} },
    { month: 11, expected: 5000, paidBy: { adit: 15000 } },
  ])

  const result = computeArrears(matrix, 2026, 0)
  assert.equal(result.get("adit"), undefined)
})

test("beforeMonth limits arrears to months before the opened period", () => {
  // Hanya Sep yang dinilai (bulan sebelum Okt yang dibuka);
  // Adit bayar Sep => bersih; Budi tidak => nunggak 1 bulan.
  const matrix = matrixFrom([
    { month: 9, expected: 5000, paidBy: { adit: 5000 } },
    { month: 10, expected: 5000, paidBy: { budi: 5000 } },
  ])

  const result = computeArrears(matrix, 2026, 10)
  assert.equal(result.get("adit"), undefined)
  assert.deepEqual(result.get("budi"), { count: 1, amount: 5000 })
})

test("underpaid month fully covered by the next month overpayment", () => {
  // Sep bayar 2rb dari 5rb (kurang 3rb), Okt bayar 8rb dari 5rb (lebih 3rb)
  // => kelebihan Okt menutup sisa Sep => lunas
  const matrix = matrixFrom([
    { month: 9, expected: 5000, paidBy: { adit: 2000 } },
    { month: 10, expected: 5000, paidBy: { adit: 8000 } },
  ])

  const result = computeArrears(matrix, 2026, 0)
  assert.equal(result.get("adit"), undefined)
})

test("returns a Map even when everything is paid", () => {
  const matrix = matrixFrom([
    { month: 9, expected: 5000, paidBy: { adit: 5000, budi: 5000 } },
  ])

  const result = computeArrears(matrix, 2026, 0)
  assert.ok(result instanceof Map)
  assert.equal(result.size, 0)
})

test("current-month shortfalls become arrears only after an active draw", () => {
  const now = new Date(2026, 10, 19)
  const matrix = matrixFrom([{ month: 11, expected: 5000, paidBy: { adit: 2000 } }])
  assert.equal(computeArrears(matrix, 2026, 0, now).size, 0)
  assert.equal(computeMonthlyDeficits(matrix, 2026, 0, now).size, 0)

  matrix.months[0].hasActiveDraw = true
  assert.deepEqual(computeArrears(matrix, 2026, 0, now).get("adit"), { count: 1, amount: 3000 })
  assert.equal(computeMonthlyDeficits(matrix, 2026, 0, now).get("adit")?.get(11), 3000)
  assert.deepEqual(computeArrears(matrix, 2026, 0, now).get("budi"), { count: 1, amount: 5000 })
})

test("voiding the current draw removes its early due date but past months remain due", () => {
  const now = new Date(2026, 10, 19)
  const matrix = matrixFrom([
    { month: 10, expected: 5000, paidBy: {}, hasActiveDraw: false },
    { month: 11, expected: 5000, paidBy: {}, hasActiveDraw: true },
  ])
  assert.deepEqual(computeArrears(matrix, 2026, 0, now).get("adit"), { count: 2, amount: 10000 })
  matrix.months[1].hasActiveDraw = false
  assert.deepEqual(computeArrears(matrix, 2026, 0, now).get("adit"), { count: 1, amount: 5000 })
  assert.deepEqual([...computeMonthlyDeficits(matrix, 2026, 0, now).get("adit")!.keys()], [10])
})

test("payments still settle oldest deficits when the current month is drawn", () => {
  const matrix = matrixFrom([
    { month: 10, expected: 5000, paidBy: {} },
    { month: 11, expected: 5000, paidBy: { adit: 12000 }, hasActiveDraw: true },
    { month: 12, expected: 5000, paidBy: { budi: 13000 } },
  ])
  const now = new Date(2026, 10, 19)
  assert.equal(computeArrears(matrix, 2026, 0, now).has("adit"), false)
  assert.deepEqual(computeArrears(matrix, 2026, 0, now).get("budi"), { count: 1, amount: 2000 })
  assert.equal(computeMonthlyDeficits(matrix, 2026, 0, now).get("budi")?.get(11), 2000)
})

test("future draws do not create arrears and period forms still exclude the opened period", () => {
  const matrix = matrixFrom([
    { month: 11, expected: 5000, paidBy: {}, hasActiveDraw: true },
    { month: 12, expected: 5000, paidBy: {}, hasActiveDraw: true },
  ])
  const now = new Date(2026, 10, 19)
  assert.deepEqual(computeArrears(matrix, 2026, 0, now).get("adit"), { count: 1, amount: 5000 })
  assert.equal(computeArrears(matrix, 2026, 11, now).size, 0)
})
