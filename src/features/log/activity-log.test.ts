import assert from "node:assert/strict"
import { mock, test } from "node:test"
import { activityLogData, logActivity } from "./activity-log"

const UUID = "9dfac38b-7e4c-4a6c-b296-068995e89cb9"

test("activityLogData maps actor and metadata to the Prisma create payload", () => {
  const data = activityLogData({
    actor: { id: UUID, name: "Sidiq", email: "sidiq@example.com" },
    action: "CREATE",
    entity: "cashIncome",
    entityId: UUID,
    summary: "Mencatat pembayaran iuran",
    after: { amount: 5000 },
  })

  assert.equal(data.actorId, UUID)
  assert.equal(data.actorName, "Sidiq")
  assert.equal(data.actorEmail, "sidiq@example.com")
  assert.equal(data.action, "CREATE")
  assert.equal(data.entity, "cashIncome")
  assert.equal(data.entityId, UUID)
  assert.deepEqual(data.after, { amount: 5000 })
  assert.equal(data.before, undefined)
})

test("activityLogData omits before/after when not provided", () => {
  const data = activityLogData({
    actor: { id: null, name: null, email: null },
    action: "LOGIN_FAILED",
    entity: "auth",
    summary: "Percobaan masuk gagal",
  })

  assert.equal(data.before, undefined)
  assert.equal(data.after, undefined)
  assert.equal(data.actorId, null)
})

test("logActivity swallows create errors (best-effort)", async () => {
  const create = mock.fn(async () => {
    throw new Error("db down")
  })
  const tx = { activityLog: { create } }

  await logActivity(tx, {
    actor: { id: UUID, name: null, email: null },
    action: "DELETE",
    entity: "member",
    summary: "Menghapus anggota",
  })

  assert.equal(create.mock.callCount(), 1)
})
