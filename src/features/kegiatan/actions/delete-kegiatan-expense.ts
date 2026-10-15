"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { isGuestSession, GUEST_WRITE_ERROR } from "@/features/auth/lib/guards"
import { kegiatanExpenseIdSchema } from "../kegiatan-schemas"
import { activityLogData } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export async function deleteKegiatanExpense(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }
  if (isGuestSession(session)) {
    return { error: GUEST_WRITE_ERROR }
  }

  const validation = kegiatanExpenseIdSchema.safeParse(formData.get("id"))
  if (!validation.success) {
    return { error: "Data tidak valid" }
  }

  try {
    const expense = await prisma.kegiatanExpense.findUnique({
      where: { id: validation.data },
    })

    if (!expense) {
      return { error: "Pengeluaran tidak ditemukan atau sudah dihapus" }
    }

    if (expense.createdById !== session.user.id) {
      return { error: "Anda tidak memiliki izin untuk menghapus pengeluaran ini" }
    }

    await prisma.$transaction([
      prisma.kegiatanExpense.delete({
        where: { id: validation.data },
      }),
      prisma.kegiatan.update({
        where: { id: expense.kegiatanId },
        data: { updatedAt: new Date() },
      }),
      prisma.activityLog.create({
        data: activityLogData({
          actor: {
            id: session.user.id,
            name: session.user.name ?? null,
            email: session.user.email ?? null,
          },
          action: "DELETE",
          entity: "kegiatanExpense",
          entityId: validation.data,
          summary: "Menghapus pengeluaran kegiatan",
          before: {
            kegiatanId: expense.kegiatanId,
            description: expense.description,
            amount: expense.amount,
            spentAt: expense.spentAt.toISOString(),
          },
        }),
      }),
    ])

    revalidatePath(`/dashboard/kegiatan/${expense.kegiatanId}`)
    return { success: true }
  }
  catch (error) {
    console.error("Failed to delete kegiatan expense:", error)
    return { error: "Gagal menghapus pengeluaran" }
  }
}
