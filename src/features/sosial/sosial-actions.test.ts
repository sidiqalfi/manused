import assert from "node:assert/strict"
import { mock, test } from "node:test"

const periodCreate = mock.fn(async () => ({}))
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
      sosialPeriod: {
        create: periodCreate,
      },
    },
  },
})
mockModule("@/features/auth/lib/auth", { exports: { auth } })
mockModule("next/cache", { exports: { revalidatePath } })

function validPeriodFormData() {
  const formData = new FormData()

  formData.set("month", "8")
  formData.set("year", "2026")
  formData.set("minAmount", "2000")

  return formData
}

test("createSosialPeriod rejects an invalid payload before creating a period", async () => {
  const { createSosialPeriod } = await import("./actions/create-sosial-period")
  const formData = validPeriodFormData()
  formData.set("minAmount", "0")

  const result = await createSosialPeriod(formData)

  assert.equal(result.error, "Data tidak valid")
  assert.equal(periodCreate.mock.callCount(), 0)
})

test("createSosialPeriod rejects an out-of-range month before creating a period", async () => {
  const { createSosialPeriod } = await import("./actions/create-sosial-period")
  const formData = validPeriodFormData()
  formData.set("month", "13")

  const result = await createSosialPeriod(formData)

  assert.equal(result.error, "Data tidak valid")
  assert.equal(periodCreate.mock.callCount(), 0)
})

test("createSosialPeriod creates a period with a valid payload", async () => {
  const { createSosialPeriod } = await import("./actions/create-sosial-period")

  const result = await createSosialPeriod(validPeriodFormData())

  assert.deepEqual(result, { success: true })
  assert.equal(periodCreate.mock.callCount(), 1)
})
