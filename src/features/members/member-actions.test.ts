import assert from "node:assert/strict"
import { mock, test } from "node:test"

const memberCreate = mock.fn(async () => ({}))
const memberUpdate = mock.fn(async () => ({}))
const memberDelete = mock.fn(async () => ({}))
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
      member: {
        create: memberCreate,
        update: memberUpdate,
        delete: memberDelete,
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
