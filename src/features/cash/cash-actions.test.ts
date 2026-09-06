import assert from "node:assert/strict"
import { mock, test } from "node:test"

const UUID = "9dfac38b-7e4c-4a6c-b296-068995e89cb9"
const USER_ID = "8a010ca6-4e5a-4d91-8490-6a6a5f4b1357"

const periodFindUnique = mock.fn(async () => ({
  id: UUID,
  minAmount: 1000,
}))
const periodCreate = mock.fn(async () => ({}))
const incomeCreate = mock.fn(async () => ({}))
const expenseCreate = mock.fn(async () => ({}))
const activityLogCreate = mock.fn(async () => ({}))
const periodUpdate = mock.fn(async () => ({}))
const transaction = mock.fn(async (ops: unknown[]) => ops)
const incomeFindUnique = mock.fn(async () => ({
  createdById: USER_ID,
  amount: 5000,
  memberId: UUID,
  periodId: UUID,
  paidAt: new Date("2026-08-24T00:00:00.000Z"),
}))
const incomeDelete = mock.fn(async () => ({}))
const expenseFindUnique = mock.fn(async () => ({
  createdById: USER_ID,
  description: "Konsumsi",
  amount: 2500,
  periodId: UUID,
  spentAt: new Date("2026-08-24T00:00:00.000Z"),
}))
const expenseDelete = mock.fn(async () => ({}))
const appSettingUpsert = mock.fn(async () => ({}))
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
        create: periodCreate,
        findUnique: periodFindUnique,
        update: periodUpdate,
      },
      cashIncome: {
        create: incomeCreate,
        findUnique: incomeFindUnique,
        delete: incomeDelete,
      },
      cashExpense: {
        create: expenseCreate,
        findUnique: expenseFindUnique,
        delete: expenseDelete,
      },
      appSetting: {
        upsert: appSettingUpsert,
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

function validIncomeFormData() {
  const formData = new FormData()

  formData.set("periodId", UUID)
  formData.set("memberId", UUID)
  formData.set("amount", "5000")
  formData.set("paidAt", "2026-08-24")
  formData.set("note", "")

  return formData
}

function validExpenseFormData() {
  const formData = new FormData()

  formData.set("periodId", UUID)
  formData.set("description", "Konsumsi")
  formData.set("amount", "2500")
  formData.set("spentAt", "2026-08-24")

  return formData
}

function validInitialBalanceFormData() {
  const formData = new FormData()
  formData.set("initialBalance", "100000")
  return formData
}

test("createCashIncome records a CREATE activity log", async () => {
  incomeCreate.mock.resetCalls()
  activityLogCreate.mock.resetCalls()
  const { createCashIncome } = await import("./actions/create-cash-income")

  const result = await createCashIncome(validIncomeFormData())

  assert.deepEqual(result, { success: true })
  assert.equal(incomeCreate.mock.callCount(), 1)
  assert.equal(activityLogCreate.mock.callCount(), 1)
  const args = activityLogCreate.mock.calls[0]?.arguments as unknown as [
    { data: Record<string, unknown> },
  ]
  const log = args[0].data as Record<string, unknown>
  assert.equal(log.action, "CREATE")
  assert.equal(log.entity, "cashIncome")
  assert.equal(log.actorId, USER_ID)
})

test("createCashExpense records a CREATE activity log", async () => {
  expenseCreate.mock.resetCalls()
  activityLogCreate.mock.resetCalls()
  const { createCashExpense } = await import("./actions/create-cash-expense")

  const result = await createCashExpense(validExpenseFormData())

  assert.deepEqual(result, { success: true })
  assert.equal(expenseCreate.mock.callCount(), 1)
  assert.equal(activityLogCreate.mock.callCount(), 1)
  const args = activityLogCreate.mock.calls[0]?.arguments as unknown as [
    { data: Record<string, unknown> },
  ]
  const log = args[0].data as Record<string, unknown>
  assert.equal(log.action, "CREATE")
  assert.equal(log.entity, "cashExpense")
})

test("deleteCashIncome records a DELETE activity log", async () => {
  activityLogCreate.mock.resetCalls()
  incomeDelete.mock.resetCalls()
  const { deleteCashIncome } = await import("./actions/delete-cash-income")

  const result = await deleteCashIncome(UUID)

  assert.deepEqual(result, { success: true })
  assert.equal(incomeDelete.mock.callCount(), 1)
  assert.equal(activityLogCreate.mock.callCount(), 1)
  const args = activityLogCreate.mock.calls[0]?.arguments as unknown as [
    { data: Record<string, unknown> },
  ]
  const log = args[0].data as Record<string, unknown>
  assert.equal(log.action, "DELETE")
  assert.equal(log.entity, "cashIncome")
})

test("deleteCashExpense records a DELETE activity log", async () => {
  activityLogCreate.mock.resetCalls()
  expenseDelete.mock.resetCalls()
  const { deleteCashExpense } = await import("./actions/delete-cash-expense")

  const result = await deleteCashExpense(UUID)

  assert.deepEqual(result, { success: true })
  assert.equal(expenseDelete.mock.callCount(), 1)
  assert.equal(activityLogCreate.mock.callCount(), 1)
  const args = activityLogCreate.mock.calls[0]?.arguments as unknown as [
    { data: Record<string, unknown> },
  ]
  const log = args[0].data as Record<string, unknown>
  assert.equal(log.action, "DELETE")
  assert.equal(log.entity, "cashExpense")
})

test("setCashInitialBalance records an appSetting activity log", async () => {
  activityLogCreate.mock.resetCalls()
  appSettingUpsert.mock.resetCalls()
  const { setCashInitialBalance } = await import("./actions/set-initial-balance")

  const result = await setCashInitialBalance(validInitialBalanceFormData())

  assert.deepEqual(result, { success: true })
  assert.equal(appSettingUpsert.mock.callCount(), 1)
  assert.equal(activityLogCreate.mock.callCount(), 1)
  const args = activityLogCreate.mock.calls[0]?.arguments as unknown as [
    { data: Record<string, unknown> },
  ]
  const log = args[0].data as Record<string, unknown>
  assert.equal(log.action, "UPDATE")
  assert.equal(log.entity, "appSetting")
})

test("createCashPeriod records a CREATE activity log", async () => {
  activityLogCreate.mock.resetCalls()
  const { createCashPeriod } = await import("./actions/create-cash-period")

  const formData = new FormData()
  formData.set("month", "8")
  formData.set("year", "2026")
  formData.set("duesAmount", "5000")
  formData.set("minAmount", "1000")

  const result = await createCashPeriod(formData)

  assert.deepEqual(result, { success: true })
  assert.equal(activityLogCreate.mock.callCount(), 1)
  const args = activityLogCreate.mock.calls[0]?.arguments as unknown as [
    { data: Record<string, unknown> },
  ]
  const log = args[0].data as Record<string, unknown>
  assert.equal(log.action, "CREATE")
  assert.equal(log.entity, "cashPeriod")
})
