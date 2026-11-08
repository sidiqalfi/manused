import assert from "node:assert/strict"
import { before, beforeEach, mock, test } from "node:test"

const ADMIN_ID = "8a010ca6-4e5a-4d91-8490-6a6a5f4b1357"
const TARGET_ID = "9dfac38b-7e4c-4a6c-b296-068995e89cb9"
const admin = { id: ADMIN_ID, name: "Admin", email: "admin@example.com", role: "ADMIN", isActive: true, tokenVersion: 4 }
const target = { id: TARGET_ID, name: "Pengurus", email: "user@example.com", role: "USER", isActive: true, createdAt: new Date(), updatedAt: new Date() }
let session: { user: typeof admin } | null
let actor: typeof admin | null
let managed: typeof target | null

const findUnique = mock.fn(async (args: { where: { id: string } }): Promise<unknown> => args.where.id === ADMIN_ID ? actor : managed)
const create = mock.fn(async (): Promise<unknown> => target)
const update = mock.fn(async (args: { data: Record<string, unknown> }): Promise<unknown> => ({ ...managed, ...args.data }))
const count = mock.fn(async () => 2)
const findMany = mock.fn(async () => [target])
const logCreate = mock.fn(async () => ({}))
const tx = { user: { findUnique, create, update, count, findMany }, activityLog: { create: logCreate } }
const transaction = mock.fn(async (callback: (client: typeof tx) => Promise<unknown>, _options?: unknown) => { void _options; return callback(tx) })
const hash = mock.fn(async () => "password-hash")
const revalidatePath = mock.fn()
const auth = mock.fn(async () => session)

mock.module("@/lib/prisma", { exports: { default: { ...tx, $transaction: transaction } } } as never)
mock.module("@/features/auth/lib/auth", { exports: { auth } } as never)
mock.module("next/cache", { exports: { revalidatePath } } as never)
mock.module("bcryptjs", { exports: { default: { hash }, hash } } as never)

let createUser: typeof import("./actions/create-user").createUser
let updateUser: typeof import("./actions/update-user").updateUser
let resetUserPassword: typeof import("./actions/reset-user-password").resetUserPassword
let getUsers: typeof import("./actions/get-users").getUsers
before(async () => {
  ;({ createUser } = await import("./actions/create-user"))
  ;({ updateUser } = await import("./actions/update-user"))
  ;({ resetUserPassword } = await import("./actions/reset-user-password"))
  ;({ getUsers } = await import("./actions/get-users"))
})

beforeEach(() => {
  session = { user: { ...admin } }
  actor = { ...admin }
  managed = { ...target }
  for (const fn of [findUnique, create, update, count, findMany, logCreate, transaction, hash, revalidatePath, auth]) fn.mock.resetCalls()
  findUnique.mock.mockImplementation(async (args) => args.where.id === ADMIN_ID ? actor : managed)
  create.mock.mockImplementation(async () => target)
  update.mock.mockImplementation(async (args) => ({ ...managed, ...args.data }))
  count.mock.mockImplementation(async () => 2)
  logCreate.mock.mockImplementation(async () => ({}))
})

function form(overrides: Record<string, string | undefined> = {}) {
  const data = new FormData()
  for (const [key, value] of Object.entries({ id: TARGET_ID, name: "Pengurus", email: "user@example.com", role: "USER", isActive: "true", password: "password123", ...overrides })) if (value !== undefined) data.set(key, value)
  return data
}

test("all user-management actions reject unauthenticated, guest, and regular sessions", async () => {
  for (const invalid of [null, { user: { ...admin, role: "guest" } }, { user: { ...admin, role: "USER" } }]) {
    session = invalid
    assert.equal((await getUsers()).success, false)
    assert.equal((await createUser(form())).success, false)
    assert.equal((await updateUser(form())).success, false)
    assert.equal((await resetUserPassword(form())).success, false)
  }
  assert.equal(transaction.mock.callCount(), 0)
  assert.equal(hash.mock.callCount(), 0)
  assert.equal(findMany.mock.callCount(), 0)
})

test("administrator claims are rejected if persisted account is inactive, demoted, missing, or revoked", async () => {
  for (const invalid of [null, { ...admin, isActive: false }, { ...admin, role: "USER" }, { ...admin, tokenVersion: 5 }]) {
    actor = invalid
    assert.equal((await createUser(form())).success, false)
    assert.equal((await updateUser(form())).success, false)
    assert.equal((await resetUserPassword(form())).success, false)
    assert.equal((await getUsers()).success, false)
  }
  assert.equal(transaction.mock.callCount(), 0)
})

test("malformed IDs, invalid access roles, status, and oversized bcrypt input are rejected before writes", async () => {
  assert.equal((await createUser(form({ password: "é".repeat(37) }))).success, false)
  assert.equal((await createUser(form({ role: "OWNER" }))).success, false)
  assert.equal((await createUser(form({ email: "invalid" }))).success, false)
  assert.equal((await updateUser(form({ id: "invalid" }))).success, false)
  assert.equal((await updateUser(form({ isActive: "invalid" }))).success, false)
  assert.equal((await resetUserPassword(form({ id: "invalid" }))).success, false)
  assert.equal(transaction.mock.callCount(), 0)
})

test("create hashes password and audits safe fields in the same transaction", async () => {
  assert.equal((await createUser(form())).success, true)
  assert.equal(hash.mock.callCount(), 1)
  const data = (create.mock.calls[0]?.arguments as unknown as [{ data: Record<string, unknown> }])[0].data
  assert.equal(data.password, "password-hash")
  const log = JSON.stringify(logCreate.mock.calls)
  assert.ok(log.includes("Menambahkan akun pengguna"))
  assert.ok(!log.includes("password123"))
  assert.ok(!log.includes("password-hash"))
})

test("duplicate email returns a useful error", async () => {
  create.mock.mockImplementation(async () => { throw { code: "P2002" } })
  const result = await createUser(form())
  assert.equal(result.success, false)
  assert.equal(result.error, "Email sudah digunakan oleh akun lain.")
})

test("last active administrator cannot be disabled or demoted", async () => {
  managed = { ...target, role: "ADMIN" }
  count.mock.mockImplementation(async () => 1)
  for (const overrides of [{ role: "USER" }, { role: "ADMIN", isActive: "false" }]) {
    const result = await updateUser(form(overrides))
    assert.equal(result.success, false)
    assert.match(result.error ?? "", /satu administrator aktif/)
  }
  assert.equal(update.mock.callCount(), 0)
})

test("role, email, and active status changes revoke sessions; name-only changes preserve them", async () => {
  for (const overrides of [{ role: "ADMIN" }, { email: "baru@example.com" }, { isActive: "false" }]) {
    assert.equal((await updateUser(form(overrides))).success, true)
    assert.deepEqual(update.mock.calls.at(-1)?.arguments[0].data.tokenVersion, { increment: 1 })
  }
  assert.equal((await updateUser(form({ name: "Nama baru" }))).success, true)
  assert.equal(update.mock.calls.at(-1)?.arguments[0].data.tokenVersion, undefined)
  assert.deepEqual(transaction.mock.calls.at(-1)?.arguments[1], { isolationLevel: "Serializable" })
})

test("self-demotion returns a signal to leave the protected page", async () => {
  const result = await updateUser(form({ id: ADMIN_ID, email: admin.email, role: "USER" }))
  assert.equal(result.success, true)
  assert.equal(result.sessionRevoked, true)
})

test("permissions are rechecked inside the mutation transaction", async () => {
  let calls = 0
  findUnique.mock.mockImplementation(async () => ++calls === 1 ? admin : { ...admin, role: "USER" })
  assert.equal((await updateUser(form())).success, false)
  assert.equal(update.mock.callCount(), 0)
})

test("password reset revokes sessions without putting secrets in the audit log", async () => {
  assert.equal((await resetUserPassword(form())).success, true)
  assert.deepEqual(update.mock.calls[0]?.arguments[0].data.tokenVersion, { increment: 1 })
  assert.equal(update.mock.calls[0]?.arguments[0].data.password, "password-hash")
  assert.ok(!JSON.stringify(logCreate.mock.calls).includes("password-hash"))
  assert.ok(!JSON.stringify(logCreate.mock.calls).includes("password123"))
})

test("serialization conflicts return a retry message", async () => {
  update.mock.mockImplementation(async () => { throw { code: "P2034" } })
  assert.match((await updateUser(form())).error ?? "", /Muat ulang/)
})

test("user list selects safe fields without password or token version", async () => {
  assert.equal((await getUsers()).success, true)
  const select = (findMany.mock.calls[0]?.arguments as unknown as [{ select: Record<string, unknown> }])[0].select
  assert.equal(select.password, undefined)
  assert.equal(select.tokenVersion, undefined)
})
