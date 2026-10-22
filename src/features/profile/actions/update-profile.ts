"use server"

import prisma from "@/lib/prisma"
import { auth } from "@features/auth/lib/auth"
import { isGuestSession, GUEST_WRITE_ERROR } from "@/features/auth/lib/guards"
import { updateProfileSchema } from "../profile-schemas"
import { logActivity } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export interface UpdateProfileResult {
  success: boolean
  error?: string
}

export async function updateProfile(
  formData: FormData
): Promise<UpdateProfileResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  if (isGuestSession(session)) {
    return { success: false, error: GUEST_WRITE_ERROR }
  }

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
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
    await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { id: userId },
        select: { name: true },
      })

      if (!existing) {
        throw new Error("USER_NOT_FOUND")
      }

      await tx.user.update({
        where: { id: userId },
        data: { name: parsed.data.name },
      })

      await logActivity(tx, {
        actor,
        action: "UPDATE",
        entity: "user",
        entityId: userId,
        summary: "Memperbarui nama profil",
        before: { name: existing.name },
        after: { name: parsed.data.name },
      })
    })

    revalidatePath("/dashboard/profile")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return { success: false, error: "User tidak ditemukan" }
    }
    return { success: false, error: "Gagal memperbarui profil" }
  }
}
