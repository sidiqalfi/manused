import type { Session } from "next-auth"
import type { Prisma } from "@/generated/prisma/client"
import prisma from "@/lib/prisma"

export const ADMIN_ACCESS_ERROR = "Hanya administrator aktif yang dapat mengelola pengguna."

/** Check persisted access and the session version; never authorize from UI claims alone. */
export async function getAdministrator(session: Session | null, db: Pick<Prisma.TransactionClient, "user"> = prisma) {
  if (!session?.user?.id || session.user.role !== "ADMIN") return null

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, isActive: true, tokenVersion: true },
  })

  if (!user?.isActive || user.role !== "ADMIN" || user.tokenVersion !== session.user.tokenVersion) return null
  return user
}
