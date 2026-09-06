import assert from "node:assert/strict"
import { mock, test } from "node:test"

const UUID = "9dfac38b-7e4c-4a6c-b296-068995e89cb9"
const UUID2 = "3e5a3d1a-8f2c-4b9d-a1b0-6c7d8e9f0a1b"
const USER_ID = "8a010ca6-4e5a-4d91-8490-6a6a5f4b1357"

const periodFindUnique = mock.fn(async () => ({ minAmount: 1000 }))
const incomeCreate = mock.fn(async () => ({}))
const incomeFindMany = mock.fn(async () => [{ memberId: UUID }])
const memberFindMany = mock.fn(async () => [
  { id: UUID },
  { id: UUID2 },
])
const activityLogCreate = mock.fn(async () => ({}))
const periodUpdate = mock.fn(async () => ({}))
const transaction = mock.fn(async (ops: unknown[]) => ops)
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
      cashPeriod: {
        findUnique: periodFindUnique,
        update: periodUpdate,
      },
      cashIncome: {
        create: incomeCreate,
        findMany: incomeFindMany,
      },
      member: {
        findMany: memberFindMany,
      },
      activityLog: {
        create: activityLogCreate,
      },
      $transaction: transaction,
    },
  },
})
mockModule("@/features/auth/lib/auth", { exports: { auth } })
mockModule("next/cache", { exports: { revalidatePath } })

function validBatchFormData() {
  const formData = new FormData()
  formData.set("mode", "selected")
  formData.set("periodId", UUID)
  formData.append("memberIds", UUID)
  formData.append("memberIds", UUID2)
  formData.set("amount", "5000")
  formData.set("paidAt", "2026-08-24")
  formData.set("note", "")
  return formData
}

test("createCashIncomesBatch rejects an empty member list", async () => {
  const { createCashIncomesBatch } = await import(
    "./actions/create-cash-incomes-batch"
  )
  const formData = new FormData()
  formData.set("mode", "selected")
  formData.set("periodId", UUID)
  formData.set("amount", "5000")
  formData.set("paidAt", "2026-08-24")
  formData.set("note", "")

  const result = await createCashIncomesBatch(formData)

  assert.equal(result.error, "Data tidak valid")
  assert.equal(incomeCreate.mock.callCount(), 0)
})

test("createCashIncomesBatch rejects an amount below the period minimum", async () => {
  const { createCashIncomesBatch } = await import(
    "./actions/create-cash-incomes-batch"
  )
  const formData = validBatchFormData()
  formData.set("amount", "500")

  const result = await createCashIncomesBatch(formData)

  assert.equal(result.error, "Nominal minimal adalah Rp 1.000")
  assert.equal(incomeCreate.mock.callCount(), 0)
})

test("createCashIncomesBatch creates one income and one log per member", async () => {
  incomeCreate.mock.resetCalls()
  activityLogCreate.mock.resetCalls()
  const { createCashIncomesBatch } = await import(
    "./actions/create-cash-incomes-batch"
  )

  const result = await createCashIncomesBatch(validBatchFormData())

  assert.deepEqual(result, { success: true, count: 2 })
  assert.equal(incomeCreate.mock.callCount(), 2)
  assert.equal(activityLogCreate.mock.callCount(), 2)

  const incomeArgs = incomeCreate.mock.calls[0]?.arguments as unknown as [
    { data: Record<string, unknown> },
  ]
  assert.equal(incomeArgs[0].data.createdById, USER_ID)
  assert.equal(incomeArgs[0].data.periodId, UUID)

  const logArgs = activityLogCreate.mock.calls[0]?.arguments as unknown as [
    { data: Record<string, unknown> },
  ]
  assert.equal(logArgs[0].data.action, "CREATE")
  assert.equal(logArgs[0].data.entity, "cashIncome")
  assert.equal(logArgs[0].data.actorId, USER_ID)
})

test("createCashIncomesBatch mode all resolves unpaid active members", async () => {
  incomeCreate.mock.resetCalls()
  const { createCashIncomesBatch } = await import(
    "./actions/create-cash-incomes-batch"
  )
  const allFormData = new FormData()
  allFormData.set("mode", "all")
  allFormData.set("periodId", UUID)
  allFormData.set("amount", "5000")
  allFormData.set("paidAt", "2026-08-24")
  allFormData.set("note", "")

  const result = await createCashIncomesBatch(allFormData)

  assert.deepEqual(result, { success: true, count: 1 })
  assert.equal(memberFindMany.mock.callCount(), 1)
  assert.equal(incomeCreate.mock.callCount(), 1)
})
