"use server"

import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { auth, signOut } from "@features/auth/lib/auth"
import { isGuestSession, GUEST_WRITE_ERROR } from "@/features/auth/lib/guards"
import { changePasswordSchema } from "../profile-schemas"
import { logActivity } from "@/features/log/activity-log"

export interface ChangePasswordResult {
  success: boolean
  error?: string
}

export async function changePassword(
  formData: FormData
): Promise<ChangePasswordResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  if (isGuestSession(session)) {
    return { success: false, error: GUEST_WRITE_ERROR }
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data tidak valid",
    }
  }

  const userId = session.user.id
  const actor = {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    })

    if (!user) {
      return { success: false, error: "User tidak ditemukan" }
    }

    const isCurrentValid = await bcrypt.compare(
      parsed.data.currentPassword,
      user.password
    )

    if (!isCurrentValid) {
      return { success: false, error: "Password lama tidak sesuai" }
    }

    const hashed = await bcrypt.hash(parsed.data.newPassword, 10)

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { password: hashed },
      })

      await logActivity(tx, {
        actor,
        action: "UPDATE",
        entity: "user.password",
        entityId: userId,
        summary: "Mengubah password",
      })
    })

    // Paksa sign-out supaya session cookie saat ini ter-clear.
    // redirect: false agar signOut tidak melempar NEXT_REDIRECT
    // (yang tadinya tertelan catch dan tampil sebagai gagal) —
    // redirect ke /login dilakukan di client setelah action sukses.
    // Catatan: JWT di device lain tetap valid sampai kedaluwarsa
    // (24 jam) — strategi jwt tidak punya mekanisme revoke tanpa
    // kolom tokenVersion.
    await signOut({ redirect: false })

    return { success: true }
  } catch {
    return { success: false, error: "Gagal mengubah password" }
  }
}
