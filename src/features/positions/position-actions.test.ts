import assert from "node:assert/strict"
import { mock, test } from "node:test"

const findMany = mock.fn(async (): Promise<{ id: string; positionId: string }[]> => [])
const updateMany = mock.fn(async () => ({}))
const createMany = mock.fn(async () => ({}))
const activityLogCreate = mock.fn(async () => ({}))
const transaction = mock.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
  cb({
    memberPositionAssignment: {
      findMany,
      updateMany,
      createMany,
    },
    activityLog: { create: activityLogCreate },
  }),
)
const auth = mock.fn<() => Promise<{ user: { id: string } } | null>>(
  async () => ({
    user: { id: "8a010ca6-4e5a-4d91-8490-6a6a5f4b1357" },
  }),
)
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
      $transaction: transaction,
      memberPositionAssignment: {
        findMany,
        updateMany,
        createMany,
      },
      activityLog: {
        create: activityLogCreate,
      },
    },
  },
})
mockModule("@/features/auth/lib/auth", { exports: { auth } })
mockModule("next/cache", { exports: { revalidatePath } })

const VALID_MEMBER_ID = "8a010ca6-4e5a-4d91-8490-6a6a5f4b1357"
const VALID_POSITION_ID = "1b2c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e"

test("updateMemberPositions rejects an invalid memberId", async () => {
  const { updateMemberPositions } = await import("./actions/update-member-positions")

  const result = await updateMemberPositions("not-a-uuid", [VALID_POSITION_ID])

  assert.deepEqual(result, { error: "Data jabatan tidak valid" })
  assert.equal(transaction.mock.callCount(), 0)
})

test("updateMemberPositions rejects an invalid positionId in the array", async () => {
  const { updateMemberPositions } = await import("./actions/update-member-positions")

  const result = await updateMemberPositions(VALID_MEMBER_ID, ["not-a-uuid"])

  assert.deepEqual(result, { error: "Data jabatan tidak valid" })
  assert.equal(transaction.mock.callCount(), 0)
})

test("updateMemberPositions rejects when the session is missing", async () => {
  auth.mock.mockImplementationOnce(async () => null)
  const { updateMemberPositions } = await import("./actions/update-member-positions")

  const result = await updateMemberPositions(VALID_MEMBER_ID, [VALID_POSITION_ID])

  assert.deepEqual(result, { error: "Unauthorized" })
  assert.equal(transaction.mock.callCount(), 0)
})

test("updateMemberPositions logs an UPDATE activity for position assignment", async () => {
  const OLD_POSITION_ID = "22222222-2222-2222-2222-222222222222"
  findMany.mock.mockImplementationOnce(async () => [
    { id: "11111111-1111-1111-1111-111111111111", positionId: OLD_POSITION_ID },
  ])
  const { updateMemberPositions } = await import("./actions/update-member-positions")

  const result = await updateMemberPositions(VALID_MEMBER_ID, [VALID_POSITION_ID])

  assert.deepEqual(result, { success: true })
  assert.equal(updateMany.mock.callCount(), 1)
  assert.equal(activityLogCreate.mock.callCount(), 1)
  const logArgs = activityLogCreate.mock.calls[0]?.arguments as unknown as [
    { data: Record<string, unknown> },
  ]
  assert.equal(logArgs[0].data.action, "UPDATE")
  assert.equal(logArgs[0].data.entity, "memberPositionAssignment")
  assert.deepEqual(logArgs[0].data.entityId, VALID_MEMBER_ID)
})
