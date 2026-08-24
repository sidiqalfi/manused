import assert from "node:assert/strict"
import test from "node:test"
import {
  createSosialPeriodSchema,
  createSosialIncomeSchema,
  createSosialExpenseSchema,
  sosialPeriodIdSchema,
  sosialIncomeIdSchema,
  sosialExpenseIdSchema,
} from "./sosial-schemas"

const UUID = "9dfac38b-7e4c-4a6c-b296-068995e89cb9"

const validPeriod = {
  month: 8,
  year: 2026,
  minAmount: 2000,
}

const validIncome = {
  periodId: UUID,
  memberId: UUID,
  amount: 2000,
  paidAt: "2026-08-24",
  note: null,
}

const validExpense = {
  periodId: UUID,
  description: "Konsumsi rapat",
  amount: 15000,
  spentAt: "2026-08-24",
}

test("accepts a valid sosial period payload", () => {
  const result = createSosialPeriodSchema.safeParse(validPeriod)

  assert.equal(result.success, true)
})

test("rejects a sosial period with a non-positive minAmount", () => {
  assert.equal(
    createSosialPeriodSchema.safeParse({ ...validPeriod, minAmount: 0 }).success,
    false
  )
})

test("rejects a sosial period with an out-of-range month", () => {
  assert.equal(
    createSosialPeriodSchema.safeParse({ ...validPeriod, month: 13 }).success,
    false
  )
})

test("accepts a valid sosial income payload and parses the date", () => {
  const result = createSosialIncomeSchema.safeParse(validIncome)

  assert.equal(result.success, true)
  if (!result.success) return

  assert.ok(result.data.paidAt instanceof Date)
  assert.equal(result.data.paidAt.toISOString().slice(0, 10), "2026-08-24")
})

test("rejects a sosial income below the positive floor (amount 0)", () => {
  assert.equal(
    createSosialIncomeSchema.safeParse({ ...validIncome, amount: 0 }).success,
    false
  )
})

test("rejects a sosial income with an invalid period id", () => {
  assert.equal(
    createSosialIncomeSchema.safeParse({
      ...validIncome,
      periodId: "not-a-uuid",
    }).success,
    false
  )
})

test("rejects a sosial income with a calendar date that does not exist", () => {
  assert.equal(
    createSosialIncomeSchema.safeParse({ ...validIncome, paidAt: "2026-02-30" })
      .success,
    false
  )
})

test("accepts a valid sosial expense payload", () => {
  assert.equal(createSosialExpenseSchema.safeParse(validExpense).success, true)
})

test("rejects a sosial expense with a blank description", () => {
  assert.equal(
    createSosialExpenseSchema.safeParse({
      ...validExpense,
      description: "   ",
    }).success,
    false
  )
})

test("rejects an invalid sosial period id", () => {
  assert.equal(sosialPeriodIdSchema.safeParse("not-a-uuid").success, false)
})

test("rejects an invalid sosial income id", () => {
  assert.equal(sosialIncomeIdSchema.safeParse("not-a-uuid").success, false)
})

test("rejects an invalid sosial expense id", () => {
  assert.equal(sosialExpenseIdSchema.safeParse("not-a-uuid").success, false)
})
