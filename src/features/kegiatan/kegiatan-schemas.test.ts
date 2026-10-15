import assert from "node:assert/strict"
import test from "node:test"
import {
  createKegiatanSchema,
  createKegiatanPaymentSchema,
  createKegiatanExpenseSchema,
  addKegiatanParticipantsBatchSchema,
  kegiatanIdSchema,
  linkCashExpenseSchema,
} from "./kegiatan-schemas"

const UUID = "9dfac38b-7e4c-4a6c-b296-068995e89cb9"

const validKegiatan = {
  name: "HUT Muda Mudi — Outbound New Rivermoon",
  eventDate: "2026-11-01",
  location: "New Rivermoon",
  feePerPerson: 50000,
  status: "PLANNED",
  note: null,
}

test("accepts a valid kegiatan payload", () => {
  const result = createKegiatanSchema.safeParse(validKegiatan)

  assert.equal(result.success, true)
  if (!result.success) return
  assert.equal(result.data.feePerPerson, 50000)
  assert.equal(result.data.eventDate.toISOString().slice(0, 10), "2026-11-01")
  // status default PLANNED
  assert.equal(result.data.status, "PLANNED")
})

test("rejects a kegiatan with negative feePerPerson", () => {
  assert.equal(
    createKegiatanSchema.safeParse({ ...validKegiatan, feePerPerson: -1 }).success,
    false
  )
})

test("allows feePerPerson 0 (event gratis)", () => {
  assert.equal(
    createKegiatanSchema.safeParse({ ...validKegiatan, feePerPerson: 0 }).success,
    true
  )
})

test("rejects a kegiatan with malformed eventDate", () => {
  assert.equal(
    createKegiatanSchema.safeParse({ ...validKegiatan, eventDate: "01-11-2026" })
      .success,
    false
  )
  assert.equal(
    createKegiatanSchema.safeParse({ ...validKegiatan, eventDate: "bukan-tanggal" })
      .success,
    false
  )
})

test("accepts a valid payment payload (partial payment allowed)", () => {
  const result = createKegiatanPaymentSchema.safeParse({
    kegiatanId: UUID,
    memberId: UUID,
    amount: 30000, // kurang dari fee 50k — parsial boleh
    paidAt: "2026-10-15",
  })

  assert.equal(result.success, true)
})

test("rejects a payment with zero amount", () => {
  assert.equal(
    createKegiatanPaymentSchema.safeParse({
      kegiatanId: UUID,
      memberId: UUID,
      amount: 0,
      paidAt: "2026-10-15",
    }).success,
    false
  )
})

test("accepts a valid expense payload", () => {
  const result = createKegiatanExpenseSchema.safeParse({
    kegiatanId: UUID,
    description: "Sewa bus",
    amount: 1500000,
    spentAt: "2026-11-01",
  })

  assert.equal(result.success, true)
})

test("rejects an expense with empty description", () => {
  assert.equal(
    createKegiatanExpenseSchema.safeParse({
      kegiatanId: UUID,
      description: "   ",
      amount: 1000,
      spentAt: "2026-11-01",
    }).success,
    false
  )
})

test("participants batch rejects empty memberIds", () => {
  assert.equal(
    addKegiatanParticipantsBatchSchema.safeParse({
      kegiatanId: UUID,
      memberIds: [],
    }).success,
    false
  )
})

test("participants batch rejects duplicate memberIds", () => {
  assert.equal(
    addKegiatanParticipantsBatchSchema.safeParse({
      kegiatanId: UUID,
      memberIds: [UUID, UUID],
    }).success,
    false
  )
})

test("participants batch accepts distinct memberIds", () => {
  assert.equal(
    addKegiatanParticipantsBatchSchema.safeParse({
      kegiatanId: UUID,
      memberIds: [UUID, "6d0a4f21-9c1e-4b6e-8f2a-3d5b7c9e0a1b"],
    }).success,
    true
  )
})

test("kegiatanIdSchema rejects non-uuid", () => {
  assert.equal(kegiatanIdSchema.safeParse("not-a-uuid").success, false)
  assert.equal(kegiatanIdSchema.safeParse(UUID).success, true)
})

test("linkCashExpenseSchema requires both ids", () => {
  assert.equal(
    linkCashExpenseSchema.safeParse({ expenseId: UUID }).success,
    false
  )
  assert.equal(
    linkCashExpenseSchema.safeParse({ expenseId: UUID, kegiatanId: UUID })
      .success,
    true
  )
})
