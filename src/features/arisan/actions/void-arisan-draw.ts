"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { arisanDrawIdSchema } from "../arisan-schemas"
import { logActivity } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export async function voidArisanDraw(drawId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const validation = arisanDrawIdSchema.safeParse(drawId)
  if (!validation.success) {
    return { error: "ID tidak valid" }
  }

  try {
    const draw = await prisma.arisanDraw.findUnique({
      where: { id: validation.data },
      select: { id: true, createdById: true, voided: true, winnerMemberId: true, cycleNumber: true },
    })

    if (!draw) {
      return { error: "Data tidak ditemukan" }
    }

    if (draw.createdById !== session.user.id) {
      return { error: "Anda tidak memiliki izin untuk membatalkan kocokan ini" }
    }

    if (draw.voided) {
      return { error: "Kocokan ini sudah dibatalkan" }
    }

    await prisma.arisanDraw.update({
      where: { id: validation.data },
      data: { voided: true, voidedAt: new Date() },
    })

    await logActivity(prisma, {
      actor: {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
      },
      action: "UPDATE",
      entity: "arisanDraw",
      entityId: validation.data,
      summary: "Membatalkan kocokan arisan",
      before: {
        voided: false,
        winnerMemberId: draw.winnerMemberId,
        cycleNumber: draw.cycleNumber,
      },
      after: {
        voided: true,
      },
    })

    revalidatePath("/dashboard/arisan")
    return { success: true }
  } catch (error) {
    console.error("Failed to void arisan draw:", error)
    return { error: "Gagal membatalkan kocokan" }
  }
}
