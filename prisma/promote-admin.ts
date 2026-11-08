import prisma from "../src/lib/prisma"
import { activityLogData } from "../src/features/log/activity-log"
import { z } from "zod"

async function main() {
  const parsed = z.email().safeParse(process.argv[2]?.trim().toLowerCase())
  if (!parsed.success || process.argv.length !== 3) {
    throw new Error("Gunakan: npm run admin:promote -- nama@example.com")
  }

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { email: parsed.data } })
    if (!user) throw new Error("Akun tidak ditemukan. Pilih email akun yang sudah ada.")
    if (!user.isActive) throw new Error("Akun nonaktif tidak dapat dipromosikan.")
    if (user.role === "ADMIN") {
      console.log("Akun sudah memiliki hak akses Administrator.")
      return
    }

    await tx.user.update({ where: { id: user.id }, data: { role: "ADMIN", tokenVersion: { increment: 1 } } })
    await tx.activityLog.create({ data: activityLogData({
      actor: { id: null, name: "CLI administrator", email: null },
      action: "UPDATE", entity: "user", entityId: user.id,
      summary: "Menetapkan administrator melalui CLI",
      before: { role: user.role }, after: { role: "ADMIN" },
    }) })
  }, { isolationLevel: "Serializable" })
  console.log("Penetapan administrator selesai. Silakan login ulang.")
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Gagal menetapkan administrator.")
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
