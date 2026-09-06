"use server"

import crypto from "crypto"
import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { createCashIncomeSchema, getCashIncomeFormValues } from "../cash-schemas"
import { activityLogData } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export async function createCashIncome(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const data = getCashIncomeFormValues(formData)
  const validation = createCashIncomeSchema.safeParse(data)

  if (!validation.success) {
    return { error: "Data tidak valid", details: validation.error.issues }
  }

  try {
    // Check if period exists first and get minAmount
    const period = await prisma.cashPeriod.findUnique({
      where: { id: validation.data.periodId },
    })

    if (!period) {
      return { error: "Periode tidak ditemukan atau sudah dihapus" }
    }

    // Validate amount >= minAmount
    if (validation.data.amount < period.minAmount) {
      return {
        error: `Nominal minimal adalah Rp ${period.minAmount.toLocaleString("id-ID")}`
      }
    }

    // Use transaction for atomic operation to prevent race conditions
    const incomeId = crypto.randomUUID()
    await prisma.$transaction([
      prisma.cashIncome.create({
        data: {
          id: incomeId,
          periodId: validation.data.periodId,
          memberId: validation.data.memberId,
          amount: validation.data.amount,
          paidAt: validation.data.paidAt,
          note: validation.data.note,
          createdById: session.user.id,
        },
      }),
      // Update period timestamp to invalidate cached queries
      prisma.cashPeriod.update({
        where: { id: validation.data.periodId },
        data: { updatedAt: new Date() },
      }),
      prisma.activityLog.create({
        data: activityLogData({
          actor: {
            id: session.user.id,
            name: session.user.name ?? null,
            email: session.user.email ?? null,
          },
          action: "CREATE",
          entity: "cashIncome",
          entityId: incomeId,
          summary: "Mencatat pembayaran iuran",
          after: {
            periodId: validation.data.periodId,
            memberId: validation.data.memberId,
            amount: validation.data.amount,
            paidAt: validation.data.paidAt.toISOString(),
            note: validation.data.note ?? null,
          },
        }),
      }),
    ])

    revalidatePath("/dashboard/cash")
    return { success: true }
  } catch (error) {
    console.error("Failed to create cash income:", error)
    const prismaError = error as { code?: string }

    // Unique constraint violation (already paid in this period)
    if (prismaError.code === "P2002") {
      return { error: "Anggota ini sudah tercatat bayar di periode ini" }
    }

    // Foreign key violation (period or member not found during insert)
    if (prismaError.code === "P2003") {
      return { error: "Data periode atau anggota tidak valid" }
    }

    // Database connection errors or missing records
    if (prismaError.code === "P2001" || prismaError.code === "P2025") {
      return { error: "Database tidak dapat diakses, coba lagi nanti" }
    }

    return { error: "Gagal mencatat pembayaran" }
  }
}
