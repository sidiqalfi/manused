"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { cashIncomeIdSchema } from "../cash-schemas"
import { logActivity } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export async function deleteCashIncome(incomeId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const validation = cashIncomeIdSchema.safeParse(incomeId)
  if (!validation.success) {
    return { error: "ID tidak valid" }
  }

  try {
    // Verify ownership: only the record creator can delete
    const income = await prisma.cashIncome.findUnique({
      where: { id: validation.data },
      select: {
        createdById: true,
        amount: true,
        memberId: true,
        periodId: true,
        paidAt: true,
      },
    })

    if (!income) {
      return { error: "Data tidak ditemukan" }
    }

    if (income.createdById !== session.user.id) {
      return { error: "Anda tidak memiliki izin untuk menghapus data ini" }
    }

    await prisma.cashIncome.delete({
      where: { id: validation.data },
    })

    await logActivity(prisma, {
      actor: {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
      },
      action: "DELETE",
      entity: "cashIncome",
      entityId: validation.data,
      summary: "Menghapus pembayaran iuran",
      before: {
        periodId: income.periodId,
        memberId: income.memberId,
        amount: income.amount,
        paidAt: income.paidAt.toISOString(),
      },
    })

    revalidatePath("/dashboard/cash")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete cash income:", error)
    return { error: "Gagal menghapus data pembayaran" }
  }
}
