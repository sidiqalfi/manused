import assert from "node:assert/strict"
import { mock, test } from "node:test"

const findMany = mock.fn(async () => [])
const updateMany = mock.fn(async () => ({}))
const createMany = mock.fn(async () => ({}))
const transaction = mock.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
  cb({
    memberRoleAssignment: {
      findMany,
      updateMany,
      createMany,
    },
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
      memberRoleAssignment: {
        findMany,
        updateMany,
        createMany,
      },
    },
  },
})
mockModule("@/features/auth/lib/auth", { exports: { auth } })
mockModule("next/cache", { exports: { revalidatePath } })

const VALID_MEMBER_ID = "8a010ca6-4e5a-4d91-8490-6a6a5f4b1357"
const VALID_ROLE_ID = "1b2c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e"

test("updateMemberRoles rejects an invalid memberId", async () => {
  const { updateMemberRoles } = await import("./actions/update-member-roles")

  const result = await updateMemberRoles("not-a-uuid", [VALID_ROLE_ID])

  assert.deepEqual(result, { error: "Data role tidak valid" })
  assert.equal(transaction.mock.callCount(), 0)
})

test("updateMemberRoles rejects an invalid roleId in the array", async () => {
  const { updateMemberRoles } = await import("./actions/update-member-roles")

  const result = await updateMemberRoles(VALID_MEMBER_ID, ["not-a-uuid"])

  assert.deepEqual(result, { error: "Data role tidak valid" })
  assert.equal(transaction.mock.callCount(), 0)
})

test("updateMemberRoles rejects when the session is missing", async () => {
  auth.mock.mockImplementationOnce(async () => null)
  const { updateMemberRoles } = await import("./actions/update-member-roles")

  const result = await updateMemberRoles(VALID_MEMBER_ID, [VALID_ROLE_ID])

  assert.deepEqual(result, { error: "Unauthorized" })
  assert.equal(transaction.mock.callCount(), 0)
})
