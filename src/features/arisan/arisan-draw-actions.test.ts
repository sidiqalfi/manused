import assert from "node:assert/strict"
import { mock, test } from "node:test"

const UUID = "9dfac38b-7e4c-4a6c-b296-068995e89cb9"
const USER_ID = "8a010ca6-4e5a-4d91-8490-6a6a5f4b1357"
const M1 = "11111111-1111-4111-8111-111111111111"
const M2 = "22222222-2222-4222-8222-222222222222"

// Stub the secure random source so index 0 always wins.
mock.method(globalThis.crypto, "getRandomValues", (array: Uint32Array) => {
  array[0] = 0
  return array
})

type DrawLike = {
  winnerMemberId: string
  cycleNumber: number
  collectedAmount: number
  payoutAmount: number
  voided: boolean
}

const periodFindUnique = mock.fn<() => Promise<{
  id: string
  contributionAmount: number
  payoutTarget: number
  draws: DrawLike[]
  incomes: { memberId: string; amount: number }[]
}>>(async () => ({
  id: UUID,
  contributionAmount: 5000,
  payoutTarget: 135000,
  draws: [],
  incomes: [
    { memberId: M1, amount: 5000 },
    { memberId: M2, amount: 5000 },
  ],
}))
const memberFindMany = mock.fn(async () => [
  { id: M1, status: "ACTIVE", name: "Sidiq", householdMembers: [] },
  { id: M2, status: "ACTIVE", name: "Rasyid", householdMembers: [] },
])
const drawFindMany = mock.fn<() => Promise<DrawLike[]>>(async () => [])
const incomeAggregate = mock.fn(async () => ({ _sum: { amount: 10000 } }))
const drawCreate = mock.fn(async () => ({}))
const drawUpdate = mock.fn(async () => ({}))
const drawFindUnique = mock.fn(async () => ({
  id: UUID,
  createdById: USER_ID,
  voided: false,
}))
const settingFindUnique = mock.fn(async () => ({ key: "arisan.initialSave", value: "100000" }))
const activityLogCreate = mock.fn(async () => ({}))
const auth = mock.fn(async () => ({ user: { id: USER_ID } }))
const revalidatePath = mock.fn()

function mockModule(
  specifier: string,
  options: { exports: Record<string, unknown> },
) {
  mock.module(specifier, options as never)
}

mockModule("@/lib/prisma", {
  exports: {
    default: {
      arisanPeriod: {
        findUnique: periodFindUnique,
      },
      member: {
        findMany: memberFindMany,
      },
      arisanDraw: {
        findMany: drawFindMany,
        findUnique: drawFindUnique,
        create: drawCreate,
        update: drawUpdate,
      },
      arisanIncome: {
        aggregate: incomeAggregate,
      },
      appSetting: {
        findUnique: settingFindUnique,
      },
      activityLog: {
        create: activityLogCreate,
      },
    },
  },
})
mockModule("@/features/auth/lib/auth", { exports: { auth } })
mockModule("next/cache", { exports: { revalidatePath } })

function previewFormData() {
  const formData = new FormData()
  formData.set("periodId", UUID)
  return formData
}

test("getArisanSummary computes savings from initial + prior draws and reports collected/target", async () => {
  drawFindMany.mock.mockImplementationOnce(async () => [
    { collectedAmount: 10000, payoutAmount: 135000, voided: false, cycleNumber: 1, winnerMemberId: M1 },
  ])

  const { getArisanSummary } = await import("./actions/get-arisan-summary")

  const result = await getArisanSummary(UUID)

  assert.equal(result.success, true)
  const summary = result.success ? result.data : null
  assert.ok(summary)
  assert.equal(summary.collected, 10000)
  assert.equal(summary.target, 135000)
  assert.equal(summary.savings, -25000)
})

test("previewArisanDraw picks a deterministic winner from the eligible pool", async () => {
  const { previewArisanDraw } = await import("./actions/preview-arisan-draw")

  const result = await previewArisanDraw(previewFormData())

  assert.equal(result.success, true)
  const preview = result.success ? result.data : null
  assert.ok(preview)
  assert.equal(preview.winnerMemberId, M1)
  assert.equal(preview.cycleNumber, 1)
  assert.deepEqual(preview.winnerHousehold, [])
})

test("previewArisanDraw restricts the pool to household heads", async () => {
  memberFindMany.mock.resetCalls()
  const { previewArisanDraw } = await import("./actions/preview-arisan-draw")

  await previewArisanDraw(previewFormData())

  const args = memberFindMany.mock.calls[0]?.arguments as unknown as [
    { where: Record<string, unknown> },
  ]
  assert.equal(args[0].where.headOfHouseholdId, null)
})

test("previewArisanDraw advances the cycle when no one is eligible in the current cycle", async () => {
  drawFindMany.mock.mockImplementationOnce(async () => [
    { collectedAmount: 0, payoutAmount: 0, voided: false, cycleNumber: 1, winnerMemberId: M1 },
    { collectedAmount: 0, payoutAmount: 0, voided: false, cycleNumber: 1, winnerMemberId: M2 },
  ])

  const { previewArisanDraw } = await import("./actions/preview-arisan-draw")

  const result = await previewArisanDraw(previewFormData())

  assert.equal(result.success, true)
  const preview = result.success ? result.data : null
  assert.ok(preview)
  assert.equal(preview.cycleNumber, 2)
  assert.equal(preview.winnerMemberId, M1)
})

test("previewArisanDraw rejects when the period already has an active draw", async () => {
  periodFindUnique.mock.mockImplementationOnce(async () => ({
    id: UUID,
    contributionAmount: 5000,
    payoutTarget: 135000,
    draws: [{ collectedAmount: 10000, payoutAmount: 135000, voided: false, cycleNumber: 1, winnerMemberId: M1 }],
    incomes: [
      { memberId: M1, amount: 5000 },
      { memberId: M2, amount: 5000 },
    ],
  }))

  const { previewArisanDraw } = await import("./actions/preview-arisan-draw")

  const result = await previewArisanDraw(previewFormData())

  assert.equal(result.error, "Periode sudah di-kocok")
})

test("performArisanDraw saves a draw with a full financial snapshot", async () => {
  const { performArisanDraw } = await import("./actions/perform-arisan-draw")
  const formData = previewFormData()
  formData.set("winnerMemberId", M1)
  formData.set("drawnAt", "2026-08-24")

  const result = await performArisanDraw(formData)

  assert.deepEqual(result, { success: true })
  assert.equal(drawCreate.mock.callCount(), 1)

  const call = drawCreate.mock.calls[0]
  assert.ok(call)
  const args = call.arguments as unknown as [{ data: Record<string, unknown> }]
  const created = args[0].data as {
    winnerMemberId: string
    cycleNumber: number
    collectedAmount: number
    payoutAmount: number
    savingsAfter: number
  }
  assert.equal(created.winnerMemberId, M1)
  assert.equal(created.cycleNumber, 1)
  assert.equal(created.collectedAmount, 10000)
  assert.equal(created.payoutAmount, 135000)
  assert.equal(created.savingsAfter, -25000)

  assert.equal(activityLogCreate.mock.callCount(), 1)
  const logArgs = activityLogCreate.mock.calls[0]?.arguments as unknown as [
    { data: Record<string, unknown> },
  ]
  const log = logArgs[0].data as Record<string, unknown>
  assert.equal(log.action, "CREATE")
  assert.equal(log.entity, "arisanDraw")
})

test("voidArisanDraw marks the draw voided", async () => {
  activityLogCreate.mock.resetCalls()
  const { voidArisanDraw } = await import("./actions/void-arisan-draw")

  const result = await voidArisanDraw(UUID)

  assert.deepEqual(result, { success: true })
  assert.equal(drawUpdate.mock.callCount(), 1)
  assert.equal(activityLogCreate.mock.callCount(), 1)
  const args = activityLogCreate.mock.calls[0]?.arguments as unknown as [
    { data: Record<string, unknown> },
  ]
  const log = args[0].data as Record<string, unknown>
  assert.equal(log.action, "UPDATE")
  assert.equal(log.entity, "arisanDraw")
})
