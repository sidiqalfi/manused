import assert from "node:assert/strict"
import { test } from "node:test"
import {
  computeEventArrears,
  computeEventDeficits,
} from "./kegiatan-arrears"
import type { KegiatanPaymentMatrix } from "@/features/kegiatan/actions/get-kegiatan-payment-matrix"

const PAST = "2026-09-01"
const FUTURE = "2099-01-01"

function matrixFrom(
  events: {
    id: string
    date: string
    expected: number
    participantIds: string[]
    paidBy: Record<string, number>
  }[]
): KegiatanPaymentMatrix {
  return {
    members: [
      { id: "adit", name: "Adit", fullName: "Adit Pratama" },
      { id: "budi", name: "Budi", fullName: "Budi Santoso" },
    ],
    events: events.map((e) => ({
      id: e.id,
      name: e.id,
      date: new Date(`${e.date}T00:00:00.000Z`),
      expected: e.expected,
      participantIds: e.participantIds,
      paidBy: e.paidBy,
    })),
  }
}

test("past event unpaid counts as arrears", () => {
  const matrix = matrixFrom([
    { id: "e1", date: PAST, expected: 50000, participantIds: ["adit"], paidBy: {} },
  ])

  const result = computeEventArrears(matrix)
  assert.deepEqual(result.get("adit"), { count: 1, amount: 50000 })
})

test("fully paid past event is clean", () => {
  const matrix = matrixFrom([
    { id: "e1", date: PAST, expected: 50000, participantIds: ["adit"], paidBy: { adit: 50000 } },
  ])

  const result = computeEventArrears(matrix)
  assert.equal(result.get("adit"), undefined)
})

test("partial payment leaves the remainder as arrears", () => {
  const matrix = matrixFrom([
    { id: "e1", date: PAST, expected: 50000, participantIds: ["adit"], paidBy: { adit: 30000 } },
  ])

  const result = computeEventArrears(matrix)
  assert.deepEqual(result.get("adit"), { count: 1, amount: 20000 })
})

test("non-participant is never in arrears for that event", () => {
  const matrix = matrixFrom([
    { id: "e1", date: PAST, expected: 50000, participantIds: ["adit"], paidBy: {} },
  ])

  const result = computeEventArrears(matrix)
  assert.equal(result.get("budi"), undefined)
})

test("future event never counts as arrears", () => {
  const matrix = matrixFrom([
    { id: "e1", date: FUTURE, expected: 50000, participantIds: ["adit"], paidBy: {} },
  ])

  const result = computeEventArrears(matrix)
  assert.equal(result.get("adit"), undefined)
})

test("overpayment in one event does NOT settle another event (no FIFO)", () => {
  const matrix = matrixFrom([
    { id: "e1", date: PAST, expected: 50000, participantIds: ["adit"], paidBy: {} },
    { id: "e2", date: PAST, expected: 50000, participantIds: ["adit"], paidBy: { adit: 100000 } },
  ])

  const result = computeEventArrears(matrix)
  // e1 tetap nunggak 50rb — kelebihan bayar e2 tidak dipindah.
  assert.deepEqual(result.get("adit"), { count: 1, amount: 50000 })
})

test("multiple past events accumulate", () => {
  const matrix = matrixFrom([
    { id: "e1", date: PAST, expected: 50000, participantIds: ["adit"], paidBy: { adit: 30000 } },
    { id: "e2", date: PAST, expected: 50000, participantIds: ["adit"], paidBy: {} },
  ])

  const result = computeEventArrears(matrix)
  assert.deepEqual(result.get("adit"), { count: 2, amount: 70000 })
})

test("computeEventDeficits marks only the deficient events", () => {
  const matrix = matrixFrom([
    { id: "e1", date: PAST, expected: 50000, participantIds: ["adit"], paidBy: { adit: 30000 } },
    { id: "e2", date: PAST, expected: 50000, participantIds: ["adit"], paidBy: { adit: 50000 } },
  ])

  const deficits = computeEventDeficits(matrix)
  const memberDeficits = deficits.get("adit")
  assert.ok(memberDeficits)
  assert.deepEqual(memberDeficits.get("e1"), 20000)
  assert.equal(memberDeficits.get("e2"), undefined)
})
