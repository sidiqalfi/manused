"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { sosialExpenseIdSchema } from "../sosial-schemas"
import { logActivity } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export async function deleteSosialExpense(expenseId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const validation = sosialExpenseIdSchema.safeParse(expenseId)
  if (!validation.success) {
    return { error: "ID tidak valid" }
  }

  try {
    // Verify ownership: only the record creator can delete
    const expense = await prisma.sosialExpense.findUnique({
      where: { id: validation.data },
      select: {
        createdById: true,
        description: true,
        amount: true,
        periodId: true,
        spentAt: true,
      },
    })

    if (!expense) {
      return { error: "Data tidak ditemukan" }
    }

    if (expense.createdById !== session.user.id) {
      return { error: "Anda tidak memiliki izin untuk menghapus data ini" }
    }

    await prisma.sosialExpense.delete({
      where: { id: validation.data },
    })

    await logActivity(prisma, {
      actor: {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
      },
      action: "DELETE",
      entity: "sosialExpense",
      entityId: validation.data,
      summary: "Menghapus pengeluaran sosial",
      before: {
        periodId: expense.periodId,
        description: expense.description,
        amount: expense.amount,
        spentAt: expense.spentAt.toISOString(),
      },
    })

    revalidatePath("/dashboard/sosial")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete sosial expense:", error)
    return { error: "Gagal menghapus data pengeluaran" }
  }
}
