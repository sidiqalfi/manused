"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { createSosialExpenseSchema, getSosialExpenseFormValues } from "../sosial-schemas"
import { revalidatePath } from "next/cache"

export async function createSosialExpense(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const data = getSosialExpenseFormValues(formData)
  const validation = createSosialExpenseSchema.safeParse(data)

  if (!validation.success) {
    return { error: "Data tidak valid", details: validation.error.issues }
  }

  try {
    // Check if period exists first and validate amount
    const period = await prisma.sosialPeriod.findUnique({
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
      prisma.sosialExpense.create({
        data: {
          periodId: validation.data.periodId,
          description: validation.data.description,
          amount: validation.data.amount,
          spentAt: validation.data.spentAt,
          createdById: session.user.id,
        },
      }),
      // Update period timestamp to invalidate cached queries
      prisma.sosialPeriod.update({
        where: { id: validation.data.periodId },
        data: { updatedAt: new Date() },
      }),
    ])

    revalidatePath("/dashboard/sosial")
    return { success: true }
  } catch (error) {
    console.error("Failed to create sosial expense:", error)
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
