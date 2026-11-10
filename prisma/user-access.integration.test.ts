import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { readFile, readdir } from "node:fs/promises"
import { mock, test } from "node:test"
import { Client } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"
import bcrypt from "bcryptjs"

// Use only a disposable test database. Every object is scoped to a temporary schema.
const testUrl = process.env.TEST_DATABASE_URL

test("administrator access and position migration on PostgreSQL", { skip: !testUrl }, async (t) => {
  const schema = `access_test_${randomUUID().replaceAll("-", "")}`
  const sql = new Client({ connectionString: testUrl })
  await sql.connect()
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: testUrl }, { schema }) })
  try {
    await sql.query(`CREATE SCHEMA "${schema}"`)
    await sql.query(`SET search_path TO "${schema}"`)
    const migrations = (await readdir("prisma/migrations")).filter((name) => /^\d/.test(name)).sort()
    const latest = migrations.pop()!
    for (const name of migrations) await sql.query(await readFile(`prisma/migrations/${name}/migration.sql`, "utf8"))

    const adminId = randomUUID(), secondId = randomUUID(), memberId = randomUUID(), positionId = randomUUID(), assignmentId = randomUUID()
    const passwordHash = await bcrypt.hash("integration-password", 10)
    await sql.query('INSERT INTO "User" (id, email, password) VALUES ($1, $2, $3)', [adminId, "admin@example.com", passwordHash])
    await sql.query('INSERT INTO "Member" (id, name, "fullName", gender, "birthDate", address, rt, rw, "createdById") VALUES ($1, $2, $2, $3, $4, $5, $6, $6, $7)', [memberId, "Anggota Uji", "MALE", "2000-01-01", "Dusun", "001", adminId])
    await sql.query('INSERT INTO "Role" (id, name, rank) VALUES ($1, $2, 3)', [positionId, "Bendahara"])
    await sql.query('INSERT INTO "MemberRoleAssignment" (id, "memberId", "roleId", "startDate", "endDate") VALUES ($1, $2, $3, $4, $5)', [assignmentId, memberId, positionId, "2025-01-01", "2025-12-31"])

    await sql.query(await readFile(`prisma/migrations/${latest}/migration.sql`, "utf8"))
    await t.test("rename preserves account, position, assignment IDs, and historical dates", async () => {
      const user = await db.user.findUniqueOrThrow({ where: { id: adminId } })
      assert.equal(user.role, "USER")
      assert.equal(user.isActive, true)
      assert.equal(user.password, passwordHash)
      const assignment = await db.memberPositionAssignment.findUniqueOrThrow({ where: { id: assignmentId }, include: { position: true } })
      assert.equal(assignment.memberId, memberId)
      assert.equal(assignment.position.id, positionId)
      assert.equal(assignment.position.name, "Bendahara")
      assert.equal(assignment.startDate.toISOString().slice(0, 10), "2025-01-01")
      assert.equal(assignment.endDate?.toISOString().slice(0, 10), "2025-12-31")
    })

    await db.user.update({ where: { id: adminId }, data: { role: "ADMIN" } })
    let actorId: string = adminId
    mock.module("@/lib/prisma", { exports: { default: db } } as never)
    mock.module("@/features/auth/lib/auth", { exports: { auth: async () => ({ user: { id: actorId, role: "ADMIN", tokenVersion: 0 } }) } } as never)
    mock.module("next/cache", { exports: { revalidatePath: () => {} } } as never)
    const { updateUser } = await import("../src/features/users/actions/update-user")
    const { resetUserPassword } = await import("../src/features/users/actions/reset-user-password")
    const { deleteUser } = await import("../src/features/users/actions/delete-user")
    function form(id: string, changes: Record<string, string> = {}) {
      const data = new FormData()
      for (const [key, value] of Object.entries({ id, name: "Administrator", email: id === adminId ? "admin@example.com" : "second@example.com", role: "USER", isActive: "true", ...changes })) data.set(key, value)
      return data
    }

    await t.test("last active administrator survives concurrent demotion attempts", async () => {
      await db.user.create({ data: { id: secondId, email: "second@example.com", password: passwordHash, role: "ADMIN" } })
      const results = await Promise.all([updateUser(form(adminId)), updateUser(form(secondId))])
      assert.equal(results.filter((result) => result.success).length, 1)
      assert.equal(await db.user.count({ where: { role: "ADMIN", isActive: true } }), 1)
      const survivor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true } })
      actorId = survivor.id
      const result = await updateUser(form(actorId))
      assert.equal(result.success, false)
      assert.match(result.error ?? "", /satu administrator aktif/)
    })

    await t.test("password reset increments version and audit omits plaintext and hash", async () => {
      const targetId = actorId === adminId ? secondId : adminId
      const before = await db.user.findUniqueOrThrow({ where: { id: targetId } })
      const data = form(targetId, { password: "new-integration-password" })
      assert.equal((await resetUserPassword(data)).success, true)
      const after = await db.user.findUniqueOrThrow({ where: { id: targetId } })
      assert.equal(after.tokenVersion, before.tokenVersion + 1)
      assert.equal(await bcrypt.compare("new-integration-password", after.password), true)
      const logs = JSON.stringify(await db.activityLog.findMany())
      assert.ok(!logs.includes("new-integration-password"))
      assert.ok(!logs.includes(after.password))
    })

    await t.test("failed audit rolls back account changes", async () => {
      const targetId = actorId === adminId ? secondId : adminId
      const before = await db.user.findUniqueOrThrow({ where: { id: targetId } })
      await sql.query('ALTER TABLE "ActivityLog" ADD CONSTRAINT "test_reject_audit" CHECK (false) NOT VALID')
      const result = await updateUser(form(targetId, { name: "Should roll back" }))
      assert.equal(result.success, false)
      assert.equal((await db.user.findUniqueOrThrow({ where: { id: targetId } })).name, before.name)
      await sql.query('ALTER TABLE "ActivityLog" DROP CONSTRAINT "test_reject_audit"')
    })

    await t.test("deletion removes the account, invalidates its token, and preserves historical logs", async () => {
      const target = await db.user.create({ data: { email: "delete@example.com", password: passwordHash } })
      const historical = await db.activityLog.create({ data: {
        actorId: target.id, actorEmail: target.email, action: "LOGIN", entity: "auth", summary: "Historical login",
      } })
      assert.equal((await deleteUser(form(target.id))).success, true)
      assert.equal(await db.user.findUnique({ where: { id: target.id } }), null)
      const { validateAccountToken } = await import("../src/features/auth/lib/session-validation")
      assert.deepEqual(validateAccountToken({ id: target.id, tokenVersion: 0 }, null), {})
      assert.equal((await db.activityLog.findUniqueOrThrow({ where: { id: historical.id } })).actorEmail, target.email)
      const log = await db.activityLog.findFirstOrThrow({ where: { action: "DELETE", entity: "user", entityId: target.id } })
      assert.equal(log.actorId, actorId)
      assert.ok(JSON.stringify(log.before).includes(target.email))
      assert.ok(!JSON.stringify(log).includes(passwordHash))
    })

    await t.test("required creator relations prevent deletion without changing recorded data", async () => {
      const target = await db.user.create({ data: { email: "linked@example.com", password: passwordHash } })
      const period = await db.cashPeriod.create({ data: { month: 1, year: 2026, duesAmount: 10000, minAmount: 5000, createdById: target.id } })
      const result = await deleteUser(form(target.id))
      assert.equal(result.success, false)
      assert.match(result.error ?? "", /Nonaktifkan akun/)
      assert.ok(await db.user.findUnique({ where: { id: target.id } }))
      assert.equal((await db.cashPeriod.findUniqueOrThrow({ where: { id: period.id } })).createdById, target.id)
      assert.equal(await db.activityLog.count({ where: { action: "DELETE", entityId: target.id } }), 0)
      const constraints = await sql.query("SELECT confdeltype FROM pg_constraint WHERE contype = 'f' AND confrelid = '\"User\"'::regclass")
      assert.equal(constraints.rows.length, 14)
      assert.ok(constraints.rows.every((row) => row.confdeltype === "r"))
    })

    await t.test("failed audit rolls back account deletion", async () => {
      const target = await db.user.create({ data: { email: "rollback-delete@example.com", password: passwordHash } })
      await sql.query('ALTER TABLE "ActivityLog" ADD CONSTRAINT "test_reject_delete_audit" CHECK (false) NOT VALID')
      try {
        assert.equal((await deleteUser(form(target.id))).success, false)
        assert.ok(await db.user.findUnique({ where: { id: target.id } }))
      } finally {
        await sql.query('ALTER TABLE "ActivityLog" DROP CONSTRAINT "test_reject_delete_audit"')
      }
    })

    await t.test("administrators cannot delete themselves, including the last active administrator", async () => {
      assert.match((await deleteUser(form(actorId))).error ?? "", /akun sendiri/)
      assert.equal(await db.user.count({ where: { role: "ADMIN", isActive: true } }), 1)
    })

    await t.test("concurrent attempts to delete each other preserve one active administrator", async () => {
      const originalActorId = actorId
      await db.user.update({ where: { id: originalActorId }, data: { role: "USER" } })
      const first = await db.user.create({ data: { email: "delete-admin-a@example.com", password: passwordHash, role: "ADMIN" } })
      const second = await db.user.create({ data: { email: "delete-admin-b@example.com", password: passwordHash, role: "ADMIN" } })
      actorId = first.id
      const firstAttempt = deleteUser(form(second.id))
      actorId = second.id
      const results = await Promise.all([firstAttempt, deleteUser(form(first.id))])
      assert.equal(results.filter((result) => result.success).length, 1)
      assert.equal(await db.user.count({ where: { role: "ADMIN", isActive: true } }), 1)
      actorId = (await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true } })).id
    })
  } finally {
    await db.$disconnect()
    await sql.query(`DROP SCHEMA "${schema}" CASCADE`)
    await sql.end()
  }
})
