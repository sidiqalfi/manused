import assert from "node:assert/strict"
import test from "node:test"
import {
  createMemberSchema,
  memberIdSchema,
  updateMemberSchema,
} from "./member-schemas"

const validMember = {
  name: "Andi",
  fullName: "Andi Prasetyo",
  gender: "MALE",
  birthDate: "2000-02-29",
  address: "Dusun Krajan RT 01/RW 02",
  phone: "",
}

test("accepts a valid create payload and normalizes a blank phone number", () => {
  const result = createMemberSchema.safeParse(validMember)

  assert.equal(result.success, true)
  if (!result.success) return

  assert.equal(result.data.phone, null)
  assert.ok(result.data.birthDate instanceof Date)
  assert.equal(result.data.birthDate.toISOString().slice(0, 10), "2000-02-29")
})

test("rejects a create payload with a blank required field", () => {
  const result = createMemberSchema.safeParse({ ...validMember, name: "   " })

  assert.equal(result.success, false)
})

test("rejects a calendar date that does not exist", () => {
  const result = createMemberSchema.safeParse({
    ...validMember,
    birthDate: "2025-02-29",
  })

  assert.equal(result.success, false)
})

test("accepts update status and rejects an unsupported status", () => {
  const validResult = updateMemberSchema.safeParse({
    ...validMember,
    phone: "081234567890",
    status: "ACTIVE",
  })
  const invalidResult = updateMemberSchema.safeParse({
    ...validMember,
    status: "PENDING",
  })

  assert.equal(validResult.success, true)
  assert.equal(invalidResult.success, false)
})

test("rejects an invalid member ID", () => {
  assert.equal(memberIdSchema.safeParse("not-a-uuid").success, false)
})
