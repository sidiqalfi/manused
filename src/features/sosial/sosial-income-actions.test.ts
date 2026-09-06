import assert from "node:assert/strict"
import { mock, test } from "node:test"

const incomeCreate = mock.fn(async () => ({}))
const incomeDelete = mock.fn(async () => ({}))
const incomeFindUnique = mock.fn(async () => null as {
  createdById: string
  amount: number
  memberId: string
  periodId: string
  paidAt: Date
} | null)
const periodFindUnique = mock.fn(async () => ({ minAmount: 2000 }))
const periodUpdate = mock.fn(async () => ({}))
const activityLogCreate = mock.fn(async () => ({}))
const transaction = mock.fn(async (ops: unknown[]) => ops)
const auth = mock.fn(async () => ({
  user: { id: "8a010ca6-4e5a-4d91-8490-6a6a5f4b1357" },
}))
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
      sosialIncome: {
        create: incomeCreate,
        delete: incomeDelete,
        findUnique: incomeFindUnique,
      },
      sosialPeriod: {
        findUnique: periodFindUnique,
        update: periodUpdate,
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

const UUID = "9dfac38b-7e4c-4a6c-b296-068995e89cb9"

function validIncomeFormData() {
  const formData = new FormData()

  formData.set("periodId", UUID)
  formData.set("memberId", UUID)
  formData.set("amount", "5000")
  formData.set("paidAt", "2026-08-24")
  formData.set("note", "")

  return formData
}

test("createSosialIncome rejects an invalid payload before creating income", async () => {
  const { createSosialIncome } = await import("./actions/create-sosial-income")
  const formData = validIncomeFormData()
  formData.set("amount", "0")

  const result = await createSosialIncome(formData)

  assert.equal(result.error, "Data tidak valid")
  assert.equal(incomeCreate.mock.callCount(), 0)
})

test("createSosialIncome rejects an amount below the period minimum", async () => {
  const { createSosialIncome } = await import("./actions/create-sosial-income")
  const formData = validIncomeFormData()
  formData.set("amount", "500")

  const result = await createSosialIncome(formData)

  assert.equal(result.error, "Nominal minimal adalah Rp 1.000")
  assert.equal(incomeCreate.mock.callCount(), 0)
})

test("createSosialIncome creates income for a valid payload", async () => {
  activityLogCreate.mock.resetCalls()
  const { createSosialIncome } = await import("./actions/create-sosial-income")

  const result = await createSosialIncome(validIncomeFormData())

  assert.deepEqual(result, { success: true })
  assert.equal(incomeCreate.mock.callCount(), 1)
  assert.equal(activityLogCreate.mock.callCount(), 1)
  const args = activityLogCreate.mock.calls[0]?.arguments as unknown as [
    { data: Record<string, unknown> },
  ]
  const log = args[0].data as Record<string, unknown>
  assert.equal(log.action, "CREATE")
  assert.equal(log.entity, "sosialIncome")
})

test("deleteSosialIncome rejects an invalid id before deleting income", async () => {
  const { deleteSosialIncome } = await import("./actions/delete-sosial-income")

  const result = await deleteSosialIncome("not-a-uuid")

  assert.deepEqual(result, { error: "ID tidak valid" })
  assert.equal(incomeDelete.mock.callCount(), 0)
})

test("deleteSosialIncome rejects deleting another user's income", async () => {
  incomeFindUnique.mock.mockImplementation(async () => ({
    createdById: "11111111-1111-4111-8111-111111111111",
    amount: 5000,
    memberId: UUID,
    periodId: UUID,
    paidAt: new Date("2026-08-24T00:00:00.000Z"),
  }))
  const { deleteSosialIncome } = await import("./actions/delete-sosial-income")

  const result = await deleteSosialIncome(UUID)

  assert.deepEqual(result, {
    error: "Anda tidak memiliki izin untuk menghapus data ini",
  })
  assert.equal(incomeDelete.mock.callCount(), 0)
})

test("deleteSosialIncome deletes the user's own income", async () => {
  activityLogCreate.mock.resetCalls()
  incomeFindUnique.mock.mockImplementation(async () => ({
    createdById: "8a010ca6-4e5a-4d91-8490-6a6a5f4b1357",
    amount: 5000,
    memberId: UUID,
    periodId: UUID,
    paidAt: new Date("2026-08-24T00:00:00.000Z"),
  }))
  const { deleteSosialIncome } = await import("./actions/delete-sosial-income")

  const result = await deleteSosialIncome(UUID)

  assert.deepEqual(result, { success: true })
  assert.equal(incomeDelete.mock.callCount(), 1)
  assert.equal(activityLogCreate.mock.callCount(), 1)
  const args = activityLogCreate.mock.calls[0]?.arguments as unknown as [
    { data: Record<string, unknown> },
  ]
  const log = args[0].data as Record<string, unknown>
  assert.equal(log.action, "DELETE")
  assert.equal(log.entity, "sosialIncome")
})
