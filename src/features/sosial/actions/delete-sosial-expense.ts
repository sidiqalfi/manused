"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { sosialExpenseIdSchema } from "../sosial-schemas"
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
      select: { createdById: true },
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

    revalidatePath("/dashboard/sosial")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete sosial expense:", error)
    return { error: "Gagal menghapus data pengeluaran" }
  }
}
