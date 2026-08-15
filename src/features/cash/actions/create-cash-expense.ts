"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { createCashExpenseSchema, getCashExpenseFormValues } from "../cash-schemas"
import { revalidatePath } from "next/cache"

export async function createCashExpense(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const data = getCashExpenseFormValues(formData)
  const validation = createCashExpenseSchema.safeParse(data)

  if (!validation.success) {
    return { error: "Data tidak valid", details: validation.error.issues }
  }

  try {
    // Check if period exists first and validate amount
    const period = await prisma.cashPeriod.findUnique({
      where: { id: validation.data.periodId },
    })

    if (!period) {
      return { error: "Periode tidak ditemukan atau sudah dihapus" }
    }

    // Validate amount > 0
    if (validation.data.amount <= 0) {
      return { error: "Nominal pengeluaran harus lebih dari 0" }
    }

    // Use transaction for atomic operation to prevent race conditions
    await prisma.$transaction([
      prisma.cashExpense.create({
        data: {
          periodId: validation.data.periodId,
          description: validation.data.description,
          amount: validation.data.amount,
          spentAt: validation.data.spentAt,
          createdById: session.user.id,
        },
      }),
      // Update period timestamp to invalidate cached queries
      prisma.cashPeriod.update({
        where: { id: validation.data.periodId },
        data: { updatedAt: new Date() },
      }),
    ])

    revalidatePath("/dashboard/cash")
    return { success: true }
  } catch (error) {
    console.error("Failed to create cash expense:", error)
    const prismaError = error as { code?: string }

    // Foreign key violation (period not found during insert)
    if (prismaError.code === "P2003") {
      return { error: "Data periode tidak valid" }
    }

    // Database connection errors or missing records
    if (prismaError.code === "P2001" || prismaError.code === "P2025") {
      return { error: "Database tidak dapat diakses, coba lagi nanti" }
    }

    return { error: "Gagal mencatat pengeluaran" }
  }
}
