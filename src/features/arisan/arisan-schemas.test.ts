import assert from "node:assert/strict"
import test from "node:test"
import {
  createArisanPeriodSchema,
  createArisanIncomeSchema,
  arisanPeriodIdSchema,
  arisanIncomeIdSchema,
  arisanDrawIdSchema,
  initialSaveSchema,
  ARISAN_INITIAL_SAVE_KEY,
} from "./arisan-schemas"

const UUID = "9dfac38b-7e4c-4a6c-b296-068995e89cb9"

const validPeriod = {
  month: 8,
  year: 2026,
  contributionAmount: 5000,
  payoutTarget: 135000,
}

const validIncome = {
  periodId: UUID,
  memberId: UUID,
  amount: 5000,
  paidAt: "2026-08-24",
  note: null,
}

test("accepts a valid arisan period payload", () => {
  assert.equal(createArisanPeriodSchema.safeParse(validPeriod).success, true)
})

test("rejects an arisan period with a non-positive contribution", () => {
  assert.equal(
    createArisanPeriodSchema.safeParse({ ...validPeriod, contributionAmount: 0 })
      .success,
    false
  )
})

test("rejects an arisan period with a non-positive payout target", () => {
  assert.equal(
    createArisanPeriodSchema.safeParse({ ...validPeriod, payoutTarget: -100 })
      .success,
    false
  )
})

test("rejects an arisan period with an out-of-range month", () => {
  assert.equal(
    createArisanPeriodSchema.safeParse({ ...validPeriod, month: 13 }).success,
    false
  )
})

test("accepts a valid arisan income payload and parses the date", () => {
  const result = createArisanIncomeSchema.safeParse(validIncome)

  assert.equal(result.success, true)
  if (!result.success) return

  assert.ok(result.data.paidAt instanceof Date)
  assert.equal(result.data.paidAt.toISOString().slice(0, 10), "2026-08-24")
})

test("rejects an arisan income below the positive floor (amount 0)", () => {
  assert.equal(
    createArisanIncomeSchema.safeParse({ ...validIncome, amount: 0 }).success,
    false
  )
})

test("rejects an arisan income with an invalid period id", () => {
  assert.equal(
    createArisanIncomeSchema.safeParse({
      ...validIncome,
      periodId: "not-a-uuid",
    }).success,
    false
  )
})

test("rejects invalid id schemas", () => {
  assert.equal(arisanPeriodIdSchema.safeParse("not-a-uuid").success, false)
  assert.equal(arisanIncomeIdSchema.safeParse("not-a-uuid").success, false)
  assert.equal(arisanDrawIdSchema.safeParse("not-a-uuid").success, false)
})

test("accepts a non-negative initial save and rejects a negative one", () => {
  assert.equal(initialSaveSchema.safeParse(0).success, true)
  assert.equal(initialSaveSchema.safeParse(135000).success, true)
  assert.equal(initialSaveSchema.safeParse(-1).success, false)
})

test("uses the agreed initial save key", () => {
  assert.equal(ARISAN_INITIAL_SAVE_KEY, "arisan.initialSave")
})
