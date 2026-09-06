import assert from "node:assert/strict"
import { mock, test } from "node:test"

const expenseCreate = mock.fn(async () => ({}))
const expenseDelete = mock.fn(async () => ({}))
const expenseFindUnique = mock.fn(async () => null as {
  createdById: string
  description: string
  amount: number
  periodId: string
  spentAt: Date
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
      sosialExpense: {
        create: expenseCreate,
        delete: expenseDelete,
        findUnique: expenseFindUnique,
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

function validExpenseFormData() {
  const formData = new FormData()

  formData.set("periodId", UUID)
  formData.set("description", "Konsumsi rapat")
  formData.set("amount", "15000")
  formData.set("spentAt", "2026-08-24")

  return formData
}

test("createSosialExpense rejects an invalid payload before creating expense", async () => {
  const { createSosialExpense } = await import("./actions/create-sosial-expense")
  const formData = validExpenseFormData()
  formData.set("description", "   ")

  const result = await createSosialExpense(formData)

  assert.equal(result.error, "Data tidak valid")
  assert.equal(expenseCreate.mock.callCount(), 0)
})

test("createSosialExpense creates expense for a valid payload", async () => {
  activityLogCreate.mock.resetCalls()
  const { createSosialExpense } = await import("./actions/create-sosial-expense")

  const result = await createSosialExpense(validExpenseFormData())

  assert.deepEqual(result, { success: true })
  assert.equal(expenseCreate.mock.callCount(), 1)
  assert.equal(activityLogCreate.mock.callCount(), 1)
  const args = activityLogCreate.mock.calls[0]?.arguments as unknown as [
    { data: Record<string, unknown> },
  ]
  const log = args[0].data as Record<string, unknown>
  assert.equal(log.action, "CREATE")
  assert.equal(log.entity, "sosialExpense")
})

test("deleteSosialExpense rejects an invalid id before deleting expense", async () => {
  const { deleteSosialExpense } = await import("./actions/delete-sosial-expense")

  const result = await deleteSosialExpense("not-a-uuid")

  assert.deepEqual(result, { error: "ID tidak valid" })
  assert.equal(expenseDelete.mock.callCount(), 0)
})

test("deleteSosialExpense rejects deleting another user's expense", async () => {
  expenseFindUnique.mock.mockImplementation(async () => ({
    createdById: "11111111-1111-4111-8111-111111111111",
    description: "Konsumsi rapat",
    amount: 15000,
    periodId: UUID,
    spentAt: new Date("2026-08-24T00:00:00.000Z"),
  }))
  const { deleteSosialExpense } = await import("./actions/delete-sosial-expense")

  const result = await deleteSosialExpense(UUID)

  assert.deepEqual(result, {
    error: "Anda tidak memiliki izin untuk menghapus data ini",
  })
  assert.equal(expenseDelete.mock.callCount(), 0)
})

test("deleteSosialExpense deletes the user's own expense", async () => {
  activityLogCreate.mock.resetCalls()
  expenseFindUnique.mock.mockImplementation(async () => ({
    createdById: "8a010ca6-4e5a-4d91-8490-6a6a5f4b1357",
    description: "Konsumsi rapat",
    amount: 15000,
    periodId: UUID,
    spentAt: new Date("2026-08-24T00:00:00.000Z"),
  }))
  const { deleteSosialExpense } = await import("./actions/delete-sosial-expense")

  const result = await deleteSosialExpense(UUID)

  assert.deepEqual(result, { success: true })
  assert.equal(expenseDelete.mock.callCount(), 1)
  assert.equal(activityLogCreate.mock.callCount(), 1)
  const args = activityLogCreate.mock.calls[0]?.arguments as unknown as [
    { data: Record<string, unknown> },
  ]
  const log = args[0].data as Record<string, unknown>
  assert.equal(log.action, "DELETE")
  assert.equal(log.entity, "sosialExpense")
})
