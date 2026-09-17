import assert from "node:assert/strict"
import { mock, test } from "node:test"

const memberCreate = mock.fn(
  async () => ({ id: "9dfac38b-7e4c-4a6c-b296-068995e89cb9" })
)
const roleFindUnique = mock.fn(async () => ({
  id: "1b2c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e",
  name: "Anggota",
}))
const memberRoleAssignmentCreate = mock.fn(async () => ({}))
const activityLogCreate = mock.fn(async () => ({}))
const transaction = mock.fn(
  async (cb: (tx: Record<string, unknown>) => Promise<unknown>) =>
    cb({
      member: { create: memberCreate },
      role: { findUnique: roleFindUnique },
      memberRoleAssignment: { create: memberRoleAssignmentCreate },
      activityLog: { create: activityLogCreate },
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
      member: { create: memberCreate },
      role: { findUnique: roleFindUnique },
      memberRoleAssignment: { create: memberRoleAssignmentCreate },
      activityLog: { create: activityLogCreate },
    },
  },
})
mockModule("next/cache", { exports: { revalidatePath } })

const GUEST_SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000000",
    name: "Tamu",
    email: "guest@manused.local",
    role: "guest" as const,
  },
}

test("isGuestSession detects guest and regular sessions", async () => {
  const { isGuestSession } = await import("@/features/auth/lib/guards")

  assert.equal(isGuestSession(GUEST_SESSION), true)
  assert.equal(
    isGuestSession({ user: { id: "abc", role: "user" as const } }),
    false
  )
  assert.equal(isGuestSession({ user: { id: "abc" } }), false)
  assert.equal(isGuestSession(null), false)
})

test("guest session is blocked from creating a member before Prisma is touched", async () => {
  mockModule("@/features/auth/lib/auth", {
    exports: { auth: mock.fn(async () => GUEST_SESSION) },
  })

  const { createMember } = await import(
    "@/features/members/actions/create-member"
  )
  const formData = new FormData()
  formData.set("name", "Andi")

  const result = await createMember(formData)

  assert.deepEqual(result, { error: "Tamu hanya dapat melihat data." })
  assert.equal(memberCreate.mock.callCount(), 0)
  assert.equal(transaction.mock.callCount(), 0)
})
