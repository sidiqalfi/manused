"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/features/auth/lib/auth"
import { ADMIN_ACCESS_ERROR, getAdministrator } from "@/features/auth/lib/administrator"
import { activityLogData } from "@/features/log/activity-log"
import prisma from "@/lib/prisma"
import { deleteUserSchema } from "../user-schemas"
import { type UserActionResult, userSelect } from "../user-select"
import { UserManagementError, userActionError } from "../user-errors"

export async function deleteUser(formData: FormData): Promise<UserActionResult> {
  const session = await auth()
  if (!await getAdministrator(session)) return { success: false, error: ADMIN_ACCESS_ERROR }

  const parsed = deleteUserSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  try {
    await prisma.$transaction(async (tx) => {
      const actor = await getAdministrator(session, tx)
      if (!actor) throw new UserManagementError(ADMIN_ACCESS_ERROR)
      const { id } = parsed.data
      if (id === actor.id) throw new UserManagementError("Anda tidak dapat menghapus akun sendiri.")

      const existing = await tx.user.findUnique({ where: { id }, select: userSelect })
      if (!existing) throw new UserManagementError("Pengguna tidak ditemukan.")
      if (existing.role === "ADMIN" && existing.isActive) {
        const activeAdmins = await tx.user.count({ where: { role: "ADMIN", isActive: true } })
        if (activeAdmins <= 1) throw new UserManagementError("Minimal satu administrator aktif harus tetap tersedia.")
      }

      // Required creator relations reject deletion while any recorded data still refers to this account.
      await tx.user.delete({ where: { id }, select: { id: true } })
      await tx.activityLog.create({ data: activityLogData({
        actor, action: "DELETE", entity: "user", entityId: id,
        summary: "Menghapus akun pengguna",
        before: { name: existing.name, email: existing.email, role: existing.role, isActive: existing.isActive },
      }) })
    }, { isolationLevel: "Serializable" })

    revalidatePath("/dashboard/users")
    return { success: true }
  } catch (error) {
    return { success: false, error: userActionError(error) }
  }
}
