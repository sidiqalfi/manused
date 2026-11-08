"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { auth } from "@/features/auth/lib/auth"
import { ADMIN_ACCESS_ERROR, getAdministrator } from "@/features/auth/lib/administrator"
import { activityLogData } from "@/features/log/activity-log"
import prisma from "@/lib/prisma"
import { createUserSchema } from "../user-schemas"
import { type UserActionResult, userSelect } from "../user-select"
import { UserManagementError, userActionError } from "../user-errors"

export async function createUser(formData: FormData): Promise<UserActionResult> {
  const session = await auth()
  if (!await getAdministrator(session)) return { success: false, error: ADMIN_ACCESS_ERROR }

  const parsed = createUserSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  try {
    const password = await bcrypt.hash(parsed.data.password, 10)
    await prisma.$transaction(async (tx) => {
      const actor = await getAdministrator(session, tx)
      if (!actor) throw new UserManagementError(ADMIN_ACCESS_ERROR)
      const user = await tx.user.create({ data: { ...parsed.data, password }, select: userSelect })
      await tx.activityLog.create({ data: activityLogData({
        actor, action: "CREATE", entity: "user", entityId: user.id,
        summary: "Menambahkan akun pengguna",
        after: { name: user.name, email: user.email, role: user.role, isActive: user.isActive },
      }) })
    }, { isolationLevel: "Serializable" })
    revalidatePath("/dashboard/users")
    return { success: true }
  } catch (error) {
    return { success: false, error: userActionError(error) }
  }
}
