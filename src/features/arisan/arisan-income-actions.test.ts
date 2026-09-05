import assert from "node:assert/strict"
import { mock, test } from "node:test"

const UUID = "9dfac38b-7e4c-4a6c-b296-068995e89cb9"
const USER_ID = "8a010ca6-4e5a-4d91-8490-6a6a5f4b1357"

const periodFindUnique = mock.fn<() => Promise<{
  id: string
  contributionAmount: number
  draws: { id: string }[]
}>>(async () => ({
  id: UUID,
  contributionAmount: 5000,
  draws: [],
}))
const incomeCreate = mock.fn(async () => ({}))
const periodUpdate = mock.fn(async () => ({}))
const transaction = mock.fn(async (ops: unknown[]) => ops)
const incomeFindUnique = mock.fn(async () => ({
  createdById: USER_ID,
  periodId: UUID,
}))
const incomeDelete = mock.fn(async () => ({}))
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
        update: periodUpdate,
      },
      arisanIncome: {
        create: incomeCreate,
        findUnique: incomeFindUnique,
        delete: incomeDelete,
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

test("createArisanIncome rejects an invalid payload before writing", async () => {
  const { createArisanIncome } = await import("./actions/create-arisan-income")
  const formData = validIncomeFormData()
  formData.set("amount", "0")

  const result = await createArisanIncome(formData)

  assert.equal(result.error, "Data tidak valid")
  assert.equal(incomeCreate.mock.callCount(), 0)
})

test("createArisanIncome accepts an amount that differs from the period contribution", async () => {
  const { createArisanIncome } = await import("./actions/create-arisan-income")
  const formData = validIncomeFormData()
  formData.set("amount", "7000")

  const result = await createArisanIncome(formData)

  assert.deepEqual(result, { success: true })
  assert.equal(incomeCreate.mock.callCount(), 1)
})

test("createArisanIncome is rejected when the period has an active draw", async () => {
  incomeCreate.mock.resetCalls()
  periodFindUnique.mock.mockImplementationOnce(async () => ({
    id: UUID,
    contributionAmount: 5000,
    draws: [{ id: "draw-1" }],
  }))

  const { createArisanIncome } = await import("./actions/create-arisan-income")

  const result = await createArisanIncome(validIncomeFormData())

  assert.equal(result.error, "Periode sudah di-kocok, iuran terkunci")
  assert.equal(incomeCreate.mock.callCount(), 0)
})

test("createArisanIncome records a valid contribution", async () => {
  incomeCreate.mock.resetCalls()
  const { createArisanIncome } = await import("./actions/create-arisan-income")

  const result = await createArisanIncome(validIncomeFormData())

  assert.deepEqual(result, { success: true })
  assert.equal(incomeCreate.mock.callCount(), 1)
})

test("deleteArisanIncome is rejected when the period has an active draw", async () => {
  periodFindUnique.mock.mockImplementationOnce(async () => ({
    id: UUID,
    contributionAmount: 5000,
    draws: [{ id: "draw-1" }],
  }))

  const { deleteArisanIncome } = await import("./actions/delete-arisan-income")

  const result = await deleteArisanIncome(UUID)

  assert.equal(result.error, "Periode sudah di-kocok, iuran terkunci")
  assert.equal(incomeDelete.mock.callCount(), 0)
})

test("deleteArisanIncome deletes when the period has no active draw", async () => {
  const { deleteArisanIncome } = await import("./actions/delete-arisan-income")

  const result = await deleteArisanIncome(UUID)

  assert.deepEqual(result, { success: true })
  assert.equal(incomeDelete.mock.callCount(), 1)
})
