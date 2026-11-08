"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/features/auth/lib/auth"
import { ADMIN_ACCESS_ERROR, getAdministrator } from "@/features/auth/lib/administrator"
import { activityLogData } from "@/features/log/activity-log"
import prisma from "@/lib/prisma"
import { updateUserSchema } from "../user-schemas"
import { type UserActionResult, userSelect } from "../user-select"
import { UserManagementError, userActionError } from "../user-errors"

export async function updateUser(formData: FormData): Promise<UserActionResult> {
  const session = await auth()
  if (!await getAdministrator(session)) return { success: false, error: ADMIN_ACCESS_ERROR }

  const parsed = updateUserSchema.safeParse({
    ...Object.fromEntries(formData),
    isActive: formData.get("isActive") === "true" ? true : formData.get("isActive") === "false" ? false : undefined,
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  try {
    const sessionRevoked = await prisma.$transaction(async (tx) => {
      const actor = await getAdministrator(session, tx)
      if (!actor) throw new UserManagementError(ADMIN_ACCESS_ERROR)
      const { id, ...changes } = parsed.data
      const existing = await tx.user.findUnique({ where: { id }, select: userSelect })
      if (!existing) throw new UserManagementError("Pengguna tidak ditemukan.")

      if (existing.role === "ADMIN" && existing.isActive && (changes.role !== "ADMIN" || !changes.isActive)) {
        const activeAdmins = await tx.user.count({ where: { role: "ADMIN", isActive: true } })
        if (activeAdmins <= 1) throw new UserManagementError("Minimal satu administrator aktif harus tetap tersedia.")
      }

      const revoke = existing.role !== changes.role || existing.isActive !== changes.isActive || existing.email !== changes.email
      const user = await tx.user.update({
        where: { id },
        data: { ...changes, ...(revoke ? { tokenVersion: { increment: 1 } } : {}) },
        select: userSelect,
      })
      await tx.activityLog.create({ data: activityLogData({
        actor, action: "UPDATE", entity: "user", entityId: id,
        summary: "Memperbarui akun pengguna",
        before: { name: existing.name, email: existing.email, role: existing.role, isActive: existing.isActive },
        after: { name: user.name, email: user.email, role: user.role, isActive: user.isActive },
      }) })
      return revoke && id === actor.id
    }, { isolationLevel: "Serializable" })

    revalidatePath("/dashboard/users")
    revalidatePath("/dashboard", "layout")
    return { success: true, sessionRevoked }
  } catch (error) {
    return { success: false, error: userActionError(error) }
  }
}
