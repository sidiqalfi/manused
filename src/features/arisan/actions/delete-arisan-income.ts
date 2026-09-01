"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { arisanIncomeIdSchema } from "../arisan-schemas"
import { revalidatePath } from "next/cache"

export async function deleteArisanIncome(incomeId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const validation = arisanIncomeIdSchema.safeParse(incomeId)
  if (!validation.success) {
    return { error: "ID tidak valid" }
  }

  try {
    const income = await prisma.arisanIncome.findUnique({
      where: { id: validation.data },
      select: { createdById: true, periodId: true },
    })

    if (!income) {
      return { error: "Data tidak ditemukan" }
    }

    if (income.createdById !== session.user.id) {
      return { error: "Anda tidak memiliki izin untuk menghapus data ini" }
    }

    const period = await prisma.arisanPeriod.findUnique({
      where: { id: income.periodId },
      include: { draws: { where: { voided: false } } },
    })

    if (period?.draws.length) {
      return { error: "Periode sudah di-kocok, iuran terkunci" }
    }

    await prisma.arisanIncome.delete({
      where: { id: validation.data },
    })

    revalidatePath("/dashboard/arisan")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete arisan income:", error)
    return { error: "Gagal menghapus data iuran arisan" }
  }
}
