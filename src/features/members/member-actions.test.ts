import assert from "node:assert/strict"
import { mock, test } from "node:test"

const MEMBER_ID = "9dfac38b-7e4c-4a6c-b296-068995e89cb9"
const ROLE_ID = "1b2c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e"

const memberCreate = mock.fn(async () => ({ id: MEMBER_ID }))
const memberUpdate = mock.fn(async () => ({}))
const memberDelete = mock.fn(async () => ({}))
const roleFindUnique = mock.fn(async () => ({
  id: ROLE_ID,
  name: "Anggota",
}))
const memberRoleAssignmentCreate = mock.fn(async () => ({}))
const transaction = mock.fn(
  async (cb: (tx: Record<string, unknown>) => Promise<unknown>) =>
    cb({
      member: { create: memberCreate },
      role: { findUnique: roleFindUnique },
      memberRoleAssignment: { create: memberRoleAssignmentCreate },
    }),
)
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
      $transaction: transaction,
      member: {
        create: memberCreate,
        update: memberUpdate,
        delete: memberDelete,
      },
      role: {
        findUnique: roleFindUnique,
      },
      memberRoleAssignment: {
        create: memberRoleAssignmentCreate,
      },
    },
  },
})
mockModule("@/features/auth/lib/auth", { exports: { auth } })
mockModule("next/cache", { exports: { revalidatePath } })

function validMemberFormData() {
  const formData = new FormData()

  formData.set("name", "Andi")
  formData.set("fullName", "Andi Prasetyo")
  formData.set("gender", "MALE")
  formData.set("birthDate", "2000-02-29")
  formData.set("address", "Krajan")
  formData.set("rt", "013")
  formData.set("rw", "006")
  formData.set("phone", "")
  formData.set("status", "ACTIVE")
  formData.set("headOfHouseholdId", "__none__")

  return formData
}

test("createMember rejects an invalid payload before creating a member", async () => {
  const { createMember } = await import("./actions/create-member")
  const formData = validMemberFormData()
  formData.set("birthDate", "2025-02-29")

  const result = await createMember(formData)

  assert.deepEqual(result, { error: "Data anggota tidak valid" })
  assert.equal(memberCreate.mock.callCount(), 0)
})

test("updateMember rejects an invalid ID before updating a member", async () => {
  const { updateMember } = await import("./actions/update-member")

  const result = await updateMember("not-a-uuid", validMemberFormData())

  assert.deepEqual(result, { error: "ID anggota tidak valid" })
  assert.equal(memberUpdate.mock.callCount(), 0)
})

test("deleteMember rejects an invalid ID before deleting a member", async () => {
  const { deleteMember } = await import("./actions/delete-member")

  const result = await deleteMember("not-a-uuid")

  assert.deepEqual(result, { error: "ID anggota tidak valid" })
  assert.equal(memberDelete.mock.callCount(), 0)
})

test("createMember rejects an invalid RT before creating a member", async () => {
  const { createMember } = await import("./actions/create-member")
  const formData = validMemberFormData()
  formData.set("rt", "13")

  const result = await createMember(formData)

  assert.deepEqual(result, { error: "Data anggota tidak valid" })
  assert.equal(memberCreate.mock.callCount(), 0)
})

test("createMember assigns the default Anggota role to a new member", async () => {
  const { createMember } = await import("./actions/create-member")

  const result = await createMember(validMemberFormData())

  assert.deepEqual(result, { success: true })
  assert.equal(memberRoleAssignmentCreate.mock.callCount(), 1)
  assert.deepEqual(memberRoleAssignmentCreate.mock.calls[0]?.arguments, [
    {
      data: {
        memberId: MEMBER_ID,
        roleId: ROLE_ID,
      },
    },
  ])
})

test("createMember normalizes the head-of-household sentinel to null", async () => {
  memberCreate.mock.resetCalls()
  const { createMember } = await import("./actions/create-member")

  const result = await createMember(validMemberFormData())

  assert.deepEqual(result, { success: true })
  const args = memberCreate.mock.calls[0]?.arguments as unknown as [
    { data: Record<string, unknown> },
  ]
  assert.equal(args[0].data.headOfHouseholdId, null)
})
