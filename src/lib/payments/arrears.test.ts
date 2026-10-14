import assert from "node:assert/strict"
import { test } from "node:test"
import { computeArrears } from "./arrears"
import type { ArisanPaymentMatrix } from "@/features/arisan/actions/get-arisan-payment-matrix"

// Skenario matrix dengan anggota adit & budi
function matrixFrom(
  months: { month: number; expected: number; paidBy: Record<string, number> }[]
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

  const result = computeArrears(matrix, 2026, 0)
  // Adit bayar Okt saja, Sep kosong => nunggak Sep
  assert.deepEqual(result.get("adit"), { count: 1, amount: 5000 })
  // Budi bayar Sep penuh => bersih
  assert.equal(result.get("budi"), undefined)
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
