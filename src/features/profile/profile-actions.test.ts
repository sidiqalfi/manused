import assert from "node:assert/strict"
import { mock, test } from "node:test"

const USER_ID = "8a010ca6-4e5a-4d91-8490-6a6a5f4b1357"

type Session = { user?: { id?: string; role?: string } } | null

let currentSession: Session = {
  user: { id: USER_ID, role: "user" },
}

const userFindUnique = mock.fn(async (): Promise<unknown> => null)
const userUpdate = mock.fn(async (args?: unknown): Promise<unknown> => ({ tokenVersion: 1 }))
const activityLogCreate = mock.fn(async () => ({}))
const transaction = mock.fn(
  async (cb: (tx: Record<string, unknown>) => Promise<unknown>) =>
    cb({
      user: { findUnique: userFindUnique, update: userUpdate },
      activityLog: { create: activityLogCreate },
    }),
)
const auth = mock.fn(async () => currentSession)
const revalidatePath = mock.fn()
const signOut = mock.fn(async () => {})
const bcryptCompare = mock.fn(async () => true)
const bcryptHash = mock.fn(async () => "hashed-new-password")

function mockModule(
  specifier: string,
  options: { exports: Record<string, unknown> }
) {
  mock.module(specifier, options as never)
}

mockModule("@/lib/prisma", {
  exports: {
    default: {
      $transaction: transaction,
      user: { findUnique: userFindUnique, update: userUpdate },
      activityLog: { create: activityLogCreate },
    },
  },
})
mockModule("@/features/auth/lib/auth", {
  exports: { auth, signOut },
})
mockModule("next/cache", { exports: { revalidatePath } })
mockModule("bcryptjs", {
  exports: {
    default: { compare: bcryptCompare, hash: bcryptHash },
    compare: bcryptCompare,
    hash: bcryptHash,
  },
})

function profileRow() {
  return {
    id: USER_ID,
    name: "Sidiq",
    email: "sidiq@example.com",
    createdAt: new Date("2026-01-15T00:00:00Z"),
  }
}

test("getProfile: tanpa sesi ditolak", async () => {
  const { getProfile } = await import("./actions/get-profile")
  const { updateProfile } = await import("./actions/update-profile")
  const { changePassword } = await import("./actions/change-password")
  userFindUnique.mock.resetCalls()
  userUpdate.mock.resetCalls()
  activityLogCreate.mock.resetCalls()
  revalidatePath.mock.resetCalls()
  signOut.mock.resetCalls()
  bcryptCompare.mock.resetCalls()
  bcryptHash.mock.resetCalls()
  currentSession = null
  const result = await getProfile()
  assert.equal(result.success, false)
  assert.equal(result.error, "Unauthorized")
})

test("getProfile: mengembalikan profil + role user", async () => {
  const { getProfile } = await import("./actions/get-profile")
  const { updateProfile } = await import("./actions/update-profile")
  const { changePassword } = await import("./actions/change-password")
  userFindUnique.mock.resetCalls()
  userUpdate.mock.resetCalls()
  activityLogCreate.mock.resetCalls()
  revalidatePath.mock.resetCalls()
  signOut.mock.resetCalls()
  bcryptCompare.mock.resetCalls()
  bcryptHash.mock.resetCalls()
  currentSession = { user: { id: USER_ID, role: "user" } }
  userFindUnique.mock.mockImplementation(async () => profileRow())

  const result = await getProfile()
  assert.equal(result.success, true)
  assert.equal(result.data?.name, "Sidiq")
  assert.equal(result.data?.role, "user")
})

test("updateProfile: tamu ditolak", async () => {
  const { getProfile } = await import("./actions/get-profile")
  const { updateProfile } = await import("./actions/update-profile")
  const { changePassword } = await import("./actions/change-password")
  userFindUnique.mock.resetCalls()
  userUpdate.mock.resetCalls()
  activityLogCreate.mock.resetCalls()
  revalidatePath.mock.resetCalls()
  signOut.mock.resetCalls()
  bcryptCompare.mock.resetCalls()
  bcryptHash.mock.resetCalls()
  currentSession = { user: { id: USER_ID, role: "guest" } }
  const fd = new FormData()
  fd.set("name", "Nama Baru")

  const result = await updateProfile(fd)
  assert.equal(result.success, false)
  assert.equal(result.error, "Tamu hanya dapat melihat data.")
  assert.equal(userUpdate.mock.callCount(), 0)
})

test("updateProfile: nama kosong ditolak validasi", async () => {
  const { getProfile } = await import("./actions/get-profile")
  const { updateProfile } = await import("./actions/update-profile")
  const { changePassword } = await import("./actions/change-password")
  userFindUnique.mock.resetCalls()
  userUpdate.mock.resetCalls()
  activityLogCreate.mock.resetCalls()
  revalidatePath.mock.resetCalls()
  signOut.mock.resetCalls()
  bcryptCompare.mock.resetCalls()
  bcryptHash.mock.resetCalls()
  currentSession = { user: { id: USER_ID, role: "user" } }
  const fd = new FormData()
  fd.set("name", "   ")

  const result = await updateProfile(fd)
  assert.equal(result.success, false)
  assert.equal(userUpdate.mock.callCount(), 0)
})

test("updateProfile: happy path menulis + log + revalidate", async () => {
  const { getProfile } = await import("./actions/get-profile")
  const { updateProfile } = await import("./actions/update-profile")
  const { changePassword } = await import("./actions/change-password")
  userFindUnique.mock.resetCalls()
  userUpdate.mock.resetCalls()
  activityLogCreate.mock.resetCalls()
  revalidatePath.mock.resetCalls()
  signOut.mock.resetCalls()
  bcryptCompare.mock.resetCalls()
  bcryptHash.mock.resetCalls()
  currentSession = { user: { id: USER_ID, role: "user" } }
  userFindUnique.mock.mockImplementation(async () => ({ name: "Lama" }))
  const fd = new FormData()
  fd.set("name", "Baru")

  const result = await updateProfile(fd)
  assert.equal(result.success, true)
  assert.equal(userUpdate.mock.callCount(), 1)
  assert.equal(activityLogCreate.mock.callCount(), 1)
  assert.equal(revalidatePath.mock.callCount() >= 1, true)
})

test("changePassword: tamu ditolak", async () => {
  const { getProfile } = await import("./actions/get-profile")
  const { updateProfile } = await import("./actions/update-profile")
  const { changePassword } = await import("./actions/change-password")
  userFindUnique.mock.resetCalls()
  userUpdate.mock.resetCalls()
  activityLogCreate.mock.resetCalls()
  revalidatePath.mock.resetCalls()
  signOut.mock.resetCalls()
  bcryptCompare.mock.resetCalls()
  bcryptHash.mock.resetCalls()
  currentSession = { user: { id: USER_ID, role: "guest" } }
  const fd = new FormData()
  fd.set("currentPassword", "oldpass123")
  fd.set("newPassword", "newpass123")
  fd.set("confirmPassword", "newpass123")

  const result = await changePassword(fd)
  assert.equal(result.success, false)
  assert.equal(userUpdate.mock.callCount(), 0)
})

test("changePassword: konfirmasi tidak cocok ditolak", async () => {
  const { getProfile } = await import("./actions/get-profile")
  const { updateProfile } = await import("./actions/update-profile")
  const { changePassword } = await import("./actions/change-password")
  userFindUnique.mock.resetCalls()
  userUpdate.mock.resetCalls()
  activityLogCreate.mock.resetCalls()
  revalidatePath.mock.resetCalls()
  signOut.mock.resetCalls()
  bcryptCompare.mock.resetCalls()
  bcryptHash.mock.resetCalls()
  currentSession = { user: { id: USER_ID, role: "user" } }
  const fd = new FormData()
  fd.set("currentPassword", "oldpass123")
  fd.set("newPassword", "newpass123")
  fd.set("confirmPassword", "beda12345")

  const result = await changePassword(fd)
  assert.equal(result.success, false)
  assert.equal(userUpdate.mock.callCount(), 0)
})

test("changePassword: sama dengan password lama ditolak", async () => {
  const { getProfile } = await import("./actions/get-profile")
  const { updateProfile } = await import("./actions/update-profile")
  const { changePassword } = await import("./actions/change-password")
  userFindUnique.mock.resetCalls()
  userUpdate.mock.resetCalls()
  activityLogCreate.mock.resetCalls()
  revalidatePath.mock.resetCalls()
  signOut.mock.resetCalls()
  bcryptCompare.mock.resetCalls()
  bcryptHash.mock.resetCalls()
  currentSession = { user: { id: USER_ID, role: "user" } }
  const fd = new FormData()
  fd.set("currentPassword", "oldpass123")
  fd.set("newPassword", "oldpass123")
  fd.set("confirmPassword", "oldpass123")

  const result = await changePassword(fd)
  assert.equal(result.success, false)
  assert.equal(userUpdate.mock.callCount(), 0)
})

test("changePassword: password lama salah ditolak", async () => {
  const { getProfile } = await import("./actions/get-profile")
  const { updateProfile } = await import("./actions/update-profile")
  const { changePassword } = await import("./actions/change-password")
  userFindUnique.mock.resetCalls()
  userUpdate.mock.resetCalls()
  activityLogCreate.mock.resetCalls()
  revalidatePath.mock.resetCalls()
  signOut.mock.resetCalls()
  bcryptCompare.mock.resetCalls()
  bcryptHash.mock.resetCalls()
  currentSession = { user: { id: USER_ID, role: "user" } }
  userFindUnique.mock.mockImplementation(async () => ({
    password: "stored-hash",
  }))
  bcryptCompare.mock.mockImplementation(async () => false)

  const fd = new FormData()
  fd.set("currentPassword", "wrongpass")
  fd.set("newPassword", "newpass123")
  fd.set("confirmPassword", "newpass123")

  const result = await changePassword(fd)
  assert.equal(result.success, false)
  assert.equal(result.error, "Password lama tidak sesuai")
  assert.equal(userUpdate.mock.callCount(), 0)
})

test("changePassword: happy path hash + tokenVersion increment + signOut", async () => {
  const { getProfile } = await import("./actions/get-profile")
  const { updateProfile } = await import("./actions/update-profile")
  const { changePassword } = await import("./actions/change-password")
  userFindUnique.mock.resetCalls()
  userUpdate.mock.resetCalls()
  activityLogCreate.mock.resetCalls()
  revalidatePath.mock.resetCalls()
  signOut.mock.resetCalls()
  bcryptCompare.mock.resetCalls()
  bcryptHash.mock.resetCalls()
  currentSession = { user: { id: USER_ID, role: "user" } }
  userFindUnique.mock.mockImplementation(async () => ({
    password: "stored-hash",
  }))
  bcryptCompare.mock.mockImplementation(async () => true)
  userUpdate.mock.mockImplementation(async () => ({ tokenVersion: 3 }))

  const fd = new FormData()
  fd.set("currentPassword", "oldpass123")
  fd.set("newPassword", "newpass123")
  fd.set("confirmPassword", "newpass123")

  const result = await changePassword(fd)
  assert.equal(result.success, true)

  // Transaksi: update membawa increment tokenVersion.
  const lastCall = userUpdate.mock.calls.at(-1) as unknown as {
    arguments: [{ data: { tokenVersion: unknown; password: string } }]
  } | undefined
  const updateArgs = lastCall?.arguments[0]
  assert.ok(updateArgs, "user.update seharusnya dipanggil")
  assert.deepEqual(updateArgs.data.tokenVersion, { increment: 1 })
  assert.equal(updateArgs.data.password, "hashed-new-password")

  assert.equal(bcryptHash.mock.callCount(), 1)
  assert.equal(signOut.mock.callCount(), 1)
  assert.equal(activityLogCreate.mock.callCount(), 1)
})

test("changePassword: password baru terlalu pendek ditolak", async () => {
  const { getProfile } = await import("./actions/get-profile")
  const { updateProfile } = await import("./actions/update-profile")
  const { changePassword } = await import("./actions/change-password")
  userFindUnique.mock.resetCalls()
  userUpdate.mock.resetCalls()
  activityLogCreate.mock.resetCalls()
  revalidatePath.mock.resetCalls()
  signOut.mock.resetCalls()
  bcryptCompare.mock.resetCalls()
  bcryptHash.mock.resetCalls()
  currentSession = { user: { id: USER_ID, role: "user" } }
  const fd = new FormData()
  fd.set("currentPassword", "oldpass123")
  fd.set("newPassword", "pendek")
  fd.set("confirmPassword", "pendek")

  const result = await changePassword(fd)
  assert.equal(result.success, false)
  assert.equal(userUpdate.mock.callCount(), 0)
})
