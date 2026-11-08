"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { auth } from "@/features/auth/lib/auth"
import { ADMIN_ACCESS_ERROR, getAdministrator } from "@/features/auth/lib/administrator"
import { activityLogData } from "@/features/log/activity-log"
import prisma from "@/lib/prisma"
import { resetUserPasswordSchema } from "../user-schemas"
import type { UserActionResult } from "../user-select"
import { UserManagementError, userActionError } from "../user-errors"

export async function resetUserPassword(formData: FormData): Promise<UserActionResult> {
  const session = await auth()
  if (!await getAdministrator(session)) return { success: false, error: ADMIN_ACCESS_ERROR }
  const parsed = resetUserPasswordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  try {
    const password = await bcrypt.hash(parsed.data.password, 10)
    await prisma.$transaction(async (tx) => {
      const actor = await getAdministrator(session, tx)
      if (!actor) throw new UserManagementError(ADMIN_ACCESS_ERROR)
      const user = await tx.user.update({
        where: { id: parsed.data.id },
        data: { password, tokenVersion: { increment: 1 } },
        select: { id: true },
      })
      await tx.activityLog.create({ data: activityLogData({
        actor, action: "UPDATE", entity: "user.password", entityId: user.id,
        summary: "Administrator mereset password pengguna",
      }) })
    }, { isolationLevel: "Serializable" })
    revalidatePath("/dashboard/users")
    return { success: true, sessionRevoked: parsed.data.id === session?.user.id }
  } catch (error) {
    return { success: false, error: userActionError(error) }
  }
}
