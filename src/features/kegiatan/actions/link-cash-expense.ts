"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { isGuestSession, GUEST_WRITE_ERROR } from "@/features/auth/lib/guards"
import { linkCashExpenseSchema, getLinkCashExpenseFormValues } from "../kegiatan-schemas"
import { activityLogData } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export async function linkCashExpenseToKegiatan(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }
  if (isGuestSession(session)) {
    return { error: GUEST_WRITE_ERROR }
  }

  const data = getLinkCashExpenseFormValues(formData)
  const validation = linkCashExpenseSchema.safeParse(data)

  if (!validation.success) {
    return { error: "Data tidak valid" }
  }

  const { expenseId, kegiatanId } = validation.data

  try {
    const [expense, kegiatan] = await Promise.all([
      prisma.cashExpense.findUnique({
        where: { id: expenseId },
        select: { id: true, description: true, relatedEventId: true },
      }),
      prisma.kegiatan.findUnique({
        where: { id: kegiatanId },
        select: { id: true, name: true },
      }),
    ])

    if (!expense) {
      return { error: "Pengeluaran kas tidak ditemukan" }
    }
    if (!kegiatan) {
      return { error: "Kegiatan tidak ditemukan" }
    }
    if (expense.relatedEventId === kegiatanId) {
      return { error: "Pengeluaran ini sudah tertaut ke kegiatan tersebut" }
    }

    await prisma.$transaction([
      prisma.cashExpense.update({
        where: { id: expenseId },
        data: { relatedEventId: kegiatanId },
      }),
      prisma.activityLog.create({
        data: activityLogData({
          actor: {
            id: session.user.id,
            name: session.user.name ?? null,
            email: session.user.email ?? null,
          },
          action: "UPDATE",
          entity: "cashExpense",
          entityId: expenseId,
          summary: `Menautkan pengeluaran kas ke kegiatan ${kegiatan.name}`,
          after: { expenseId, kegiatanId },
        }),
      }),
    ])

    revalidatePath("/dashboard/cash")
    revalidatePath(`/dashboard/kegiatan/${kegiatanId}`)
    return { success: true }
  }
  catch (error) {
    console.error("Failed to link cash expense:", error)
    return { error: "Gagal menautkan pengeluaran kas" }
  }
}
