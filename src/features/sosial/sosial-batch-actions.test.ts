import assert from "node:assert/strict"
import { mock, test } from "node:test"

const UUID = "9dfac38b-7e4c-4a6c-b296-068995e89cb9"
const UUID2 = "3e5a3d1a-8f2c-4b9d-a1b0-6c7d8e9f0a1b"
const USER_ID = "8a010ca6-4e5a-4d91-8490-6a6a5f4b1357"

const periodFindUnique = mock.fn(async () => ({ minAmount: 2000 }))
const incomeCreate = mock.fn(async () => ({}))
const incomeFindMany = mock.fn(async () => [])
const memberFindMany = mock.fn(async () => [{ id: UUID }])
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
      sosialPeriod: {
        findUnique: periodFindUnique,
        update: periodUpdate,
      },
      sosialIncome: {
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

test("createSosialIncomesBatch rejects an amount below the period minimum", async () => {
  const { createSosialIncomesBatch } = await import(
    "./actions/create-sosial-incomes-batch"
  )
  const formData = validBatchFormData()
  formData.set("amount", "1000")

  const result = await createSosialIncomesBatch(formData)

  assert.equal(result.error, "Nominal minimal adalah Rp 2.000")
  assert.equal(incomeCreate.mock.callCount(), 0)
})

test("createSosialIncomesBatch creates one income and one log per member", async () => {
  incomeCreate.mock.resetCalls()
  activityLogCreate.mock.resetCalls()
  const { createSosialIncomesBatch } = await import(
    "./actions/create-sosial-incomes-batch"
  )

  const result = await createSosialIncomesBatch(validBatchFormData())

  assert.deepEqual(result, { success: true, count: 2 })
  assert.equal(incomeCreate.mock.callCount(), 2)
  assert.equal(activityLogCreate.mock.callCount(), 2)

  const logArgs = activityLogCreate.mock.calls[0]?.arguments as unknown as [
    { data: Record<string, unknown> },
  ]
  assert.equal(logArgs[0].data.action, "CREATE")
  assert.equal(logArgs[0].data.entity, "sosialIncome")
  assert.equal(logArgs[0].data.actorId, USER_ID)
})
