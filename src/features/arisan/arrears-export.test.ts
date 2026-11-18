import assert from "node:assert/strict"
import { test } from "node:test"
import { buildArisanArrearsRows } from "./arrears-export"
import { computeArrears } from "@/lib/payments/arrears"
import type { ArisanPaymentMatrix } from "./actions/get-arisan-payment-matrix"

const now = new Date(2026, 10, 19)
const members = [
  { id: "adit", name: "Adit", fullName: "Adit Pratama" },
  { id: "budi", name: "Budi", fullName: "Budi Santoso" },
  { id: "citra", name: "Citra", fullName: "Citra Wulandari" },
]

test("exports only members with remaining arrears and lists unpaid months chronologically", () => {
  const matrix: ArisanPaymentMatrix = { members, months: [
    { month: 10, expected: 5000, paidBy: { adit: 1000, budi: 10000, citra: 5000 } },
    { month: 9, expected: 5000, paidBy: { adit: 2000, citra: 5000 } },
  ] }
  assert.deepEqual(buildArisanArrearsRows(matrix, 2026, now), [
    { name: "Adit", months: "September, Oktober", amount: 7000 },
  ])
})

test("later surplus closes the oldest deficit and exports the remaining partial shortfall", () => {
  const matrix: ArisanPaymentMatrix = { members, months: [
    { month: 8, expected: 5000, paidBy: {} },
    { month: 9, expected: 5000, paidBy: {} },
    { month: 10, expected: 5000, paidBy: { adit: 12000 } },
  ] }
  const rows = buildArisanArrearsRows(matrix, 2026, now)
  assert.deepEqual(rows[0], { name: "Adit", months: "September", amount: 3000 })
  const totals = computeArrears(matrix, 2026, 0, now)
  matrix.members.forEach((member, index) => assert.equal(rows[index].amount, totals.get(member.id)?.amount))
})

test("current and future months are excluded but their overpayments can settle older months", () => {
  const matrix: ArisanPaymentMatrix = { members: [members[0]], months: [
    { month: 9, expected: 5000, paidBy: {} },
    { month: 10, expected: 5000, paidBy: {} },
    { month: 11, expected: 5000, paidBy: {} },
    { month: 12, expected: 5000, paidBy: { adit: 12000 } },
  ] }
  assert.deepEqual(buildArisanArrearsRows(matrix, 2026, now), [
    { name: "Adit", months: "Oktober", amount: 3000 },
  ])
  assert.deepEqual(buildArisanArrearsRows({ ...matrix, months: matrix.months.slice(2) }, 2026, now), [])
})

test("empty or fully settled matrices produce no export rows", () => {
  assert.deepEqual(buildArisanArrearsRows({ members, months: [] }, 2026, now), [])
  assert.deepEqual(buildArisanArrearsRows({ members: [], months: [{ month: 9, expected: 5000, paidBy: {} }] }, 2026, now), [])
  assert.deepEqual(buildArisanArrearsRows({ members: [members[0]], months: [{ month: 9, expected: 5000, paidBy: { adit: 5000 } }] }, 2026, now), [])
})

test("exports the selected year and preserves member names as data", () => {
  const matrix: ArisanPaymentMatrix = { members: [{ ...members[0], name: '=HYPERLINK("https://example.com")' }], months: [
    { month: 12, expected: 7500, paidBy: {} },
  ] }
  assert.deepEqual(buildArisanArrearsRows(matrix, 2025, now), [
    { name: '=HYPERLINK("https://example.com")', months: "Desember", amount: 7500 },
  ])
  assert.deepEqual(buildArisanArrearsRows(matrix, 2027, now), [])
})

test("export includes current-month arrears after drawing and removes them when the draw is voided", () => {
  const matrix: ArisanPaymentMatrix = { members: [members[0]], months: [
    { month: 11, expected: 5000, paidBy: { adit: 1500 }, hasActiveDraw: true },
  ] }
  assert.deepEqual(buildArisanArrearsRows(matrix, 2026, now), [
    { name: "Adit", months: "November", amount: 3500 },
  ])
  matrix.months[0].hasActiveDraw = false
  assert.deepEqual(buildArisanArrearsRows(matrix, 2026, now), [])
})
