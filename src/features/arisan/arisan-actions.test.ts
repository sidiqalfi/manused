import assert from "node:assert/strict"
import { mock, test } from "node:test"

const periodCreate = mock.fn(async () => ({}))
const periodFindMany = mock.fn(async () => [])
const settingFindUnique = mock.fn(async () => null)
const settingUpsert = mock.fn(async () => ({}))
const activityLogCreate = mock.fn(async () => ({}))
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
      arisanPeriod: {
        create: periodCreate,
        findMany: periodFindMany,
      },
      appSetting: {
        findUnique: settingFindUnique,
        upsert: settingUpsert,
      },
      activityLog: {
        create: activityLogCreate,
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
  formData.set("contributionAmount", "5000")
  formData.set("payoutTarget", "135000")

  return formData
}

function validInitialSaveFormData() {
  const formData = new FormData()
  formData.set("initialSave", "135000")
  return formData
}

test("createArisanPeriod rejects an invalid payload before creating a period", async () => {
  const { createArisanPeriod } = await import("./actions/create-arisan-period")
  const formData = validPeriodFormData()
  formData.set("contributionAmount", "0")

  const result = await createArisanPeriod(formData)

  assert.equal(result.error, "Data tidak valid")
  assert.equal(periodCreate.mock.callCount(), 0)
})

test("createArisanPeriod rejects an out-of-range month before creating a period", async () => {
  const { createArisanPeriod } = await import("./actions/create-arisan-period")
  const formData = validPeriodFormData()
  formData.set("month", "13")

  const result = await createArisanPeriod(formData)

  assert.equal(result.error, "Data tidak valid")
  assert.equal(periodCreate.mock.callCount(), 0)
})

test("createArisanPeriod creates a period with a valid payload", async () => {
  const { createArisanPeriod } = await import("./actions/create-arisan-period")

  const result = await createArisanPeriod(validPeriodFormData())

  assert.deepEqual(result, { success: true })
  assert.equal(periodCreate.mock.callCount(), 1)
  assert.equal(activityLogCreate.mock.callCount(), 1)
  const args = activityLogCreate.mock.calls[0]?.arguments as unknown as [
    { data: Record<string, unknown> },
  ]
  const log = args[0].data as Record<string, unknown>
  assert.equal(log.action, "CREATE")
  assert.equal(log.entity, "arisanPeriod")
})

test("getArisanPeriods returns the list when successful", async () => {
  const { getArisanPeriods } = await import("./actions/get-arisan-periods")

  const result = await getArisanPeriods()

  assert.equal(result.success, true)
  assert.deepEqual(result.data, [])
  assert.equal(periodFindMany.mock.callCount(), 1)
})

test("getInitialSave returns zero when no setting exists", async () => {
  const { getInitialSave } = await import("./actions/get-initial-save")

  const result = await getInitialSave()

  assert.deepEqual(result, { success: true, data: { initialSave: 0 } })
  assert.equal(settingFindUnique.mock.callCount(), 1)
})

test("setInitialSave rejects a negative value before upserting", async () => {
  const { setInitialSave } = await import("./actions/set-initial-save")
  const formData = validInitialSaveFormData()
  formData.set("initialSave", "-1")

  const result = await setInitialSave(formData)

  assert.equal(result.error, "Data tidak valid")
  assert.equal(settingUpsert.mock.callCount(), 0)
})

test("setInitialSave persists a valid value", async () => {
  activityLogCreate.mock.resetCalls()
  const { setInitialSave } = await import("./actions/set-initial-save")

  const result = await setInitialSave(validInitialSaveFormData())

  assert.deepEqual(result, { success: true })
  assert.equal(settingUpsert.mock.callCount(), 1)
  assert.equal(activityLogCreate.mock.callCount(), 1)
  const args = activityLogCreate.mock.calls[0]?.arguments as unknown as [
    { data: Record<string, unknown> },
  ]
  const log = args[0].data as Record<string, unknown>
  assert.equal(log.action, "UPDATE")
  assert.equal(log.entity, "appSetting")
})
