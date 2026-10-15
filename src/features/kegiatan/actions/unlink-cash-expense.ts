"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { isGuestSession, GUEST_WRITE_ERROR } from "@/features/auth/lib/guards"
import { unlinkCashExpenseSchema, getUnlinkCashExpenseFormValues } from "../kegiatan-schemas"
import { activityLogData } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export async function unlinkCashExpenseFromKegiatan(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }
  if (isGuestSession(session)) {
    return { error: GUEST_WRITE_ERROR }
  }

  const data = getUnlinkCashExpenseFormValues(formData)
  const validation = unlinkCashExpenseSchema.safeParse(data)

  if (!validation.success) {
    return { error: "Data tidak valid" }
  }

  const { expenseId } = validation.data

  try {
    const expense = await prisma.cashExpense.findUnique({
      where: { id: expenseId },
      select: { id: true, relatedEventId: true },
    })

    if (!expense) {
      return { error: "Pengeluaran kas tidak ditemukan" }
    }
    if (!expense.relatedEventId) {
      return { error: "Pengeluaran ini tidak tertaut ke kegiatan mana pun" }
    }

    await prisma.$transaction([
      prisma.cashExpense.update({
        where: { id: expenseId },
        data: { relatedEventId: null },
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
          summary: "Melepas tautan pengeluaran kas dari kegiatan",
          before: { expenseId, kegiatanId: expense.relatedEventId },
          after: { expenseId, kegiatanId: null },
        }),
      }),
    ])

    revalidatePath("/dashboard/cash")
    revalidatePath("/dashboard/kegiatan")
    return { success: true }
  }
  catch (error) {
    console.error("Failed to unlink cash expense:", error)
    return { error: "Gagal melepas tautan pengeluaran kas" }
  }
}
