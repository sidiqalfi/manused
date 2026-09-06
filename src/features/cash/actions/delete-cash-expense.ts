"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { cashExpenseIdSchema } from "../cash-schemas"
import { logActivity } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export async function deleteCashExpense(expenseId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const validation = cashExpenseIdSchema.safeParse(expenseId)
  if (!validation.success) {
    return { error: "ID tidak valid" }
  }

  try {
    // Verify ownership: only the record creator can delete
    const expense = await prisma.cashExpense.findUnique({
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

    await prisma.cashExpense.delete({
      where: { id: validation.data },
    })

    await logActivity(prisma, {
      actor: {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
      },
      action: "DELETE",
      entity: "cashExpense",
      entityId: validation.data,
      summary: "Menghapus pengeluaran",
      before: {
        periodId: expense.periodId,
        description: expense.description,
        amount: expense.amount,
        spentAt: expense.spentAt.toISOString(),
      },
    })

    revalidatePath("/dashboard/cash")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete cash expense:", error)
    return { error: "Gagal menghapus data pengeluaran" }
  }
}
