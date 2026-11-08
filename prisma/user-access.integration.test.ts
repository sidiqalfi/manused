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
  } finally {
    await db.$disconnect()
    await sql.query(`DROP SCHEMA "${schema}" CASCADE`)
    await sql.end()
  }
})
