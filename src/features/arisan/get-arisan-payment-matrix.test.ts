import assert from "node:assert/strict"
import { before, beforeEach, mock, test } from "node:test"

let loggedIn = true
const periodFindMany = mock.fn(async (_args: unknown) => {
  void _args
  return [
    { id: "sep", month: 9, contributionAmount: 5000, draws: [] },
    { id: "oct", month: 10, contributionAmount: 5000, draws: [] },
    { id: "nov", month: 11, contributionAmount: 7500, draws: [{ id: "draw-nov" }] },
    { id: "dec", month: 12, contributionAmount: 5000, draws: [] },
  ]
})
const incomeFindMany = mock.fn(async () => [
  { periodId: "sep", memberId: "adit", amount: 2000 },
  { periodId: "sep", memberId: "adit", amount: 1000 },
  { periodId: "dec", memberId: "budi", amount: 5000 },
])
const memberFindMany = mock.fn(async () => [{ id: "adit", name: "Adit", fullName: "Adit Pratama" }])
mock.module("@/lib/prisma", { exports: { default: {
  arisanPeriod: { findMany: periodFindMany },
  arisanIncome: { findMany: incomeFindMany },
  member: { findMany: memberFindMany },
} } } as never)
mock.module("@/features/auth/lib/auth", { exports: { auth: async () => loggedIn ? { user: { id: "user-id" } } : null } } as never)

let getArisanPaymentMatrix: typeof import("./actions/get-arisan-payment-matrix").getArisanPaymentMatrix
before(async () => { ({ getArisanPaymentMatrix } = await import("./actions/get-arisan-payment-matrix")) })
beforeEach(() => {
  loggedIn = true
  for (const fn of [periodFindMany, incomeFindMany, memberFindMany]) fn.mock.resetCalls()
})

test("payment matrix requires authentication and a valid year before querying", async () => {
  loggedIn = false
  assert.equal((await getArisanPaymentMatrix(2026)).success, false)
  loggedIn = true
  assert.equal((await getArisanPaymentMatrix(2019)).success, false)
  assert.equal(periodFindMany.mock.callCount(), 0)
})

test("payment matrix includes a drawn period with no income and only selects non-voided draws", async () => {
  const result = await getArisanPaymentMatrix(2026)
  assert.equal(result.success, true)
  assert.deepEqual(result.data?.months, [
    { month: 9, paidBy: { adit: 3000 }, expected: 5000, hasActiveDraw: false },
    { month: 11, paidBy: {}, expected: 7500, hasActiveDraw: true },
    { month: 12, paidBy: { budi: 5000 }, expected: 5000, hasActiveDraw: false },
  ])
  const args = periodFindMany.mock.calls[0].arguments[0] as { where: unknown; select: { draws: unknown } }
  assert.deepEqual(args.where, { year: 2026 })
  assert.deepEqual(args.select.draws, { where: { voided: false }, select: { id: true }, take: 1 })
})
