"use server"

import crypto from "crypto"
import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { createArisanIncomeSchema, getArisanIncomeFormValues } from "../arisan-schemas"
import { activityLogData } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export async function createArisanIncome(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const data = getArisanIncomeFormValues(formData)
  const validation = createArisanIncomeSchema.safeParse(data)

  if (!validation.success) {
    return { error: "Data tidak valid", details: validation.error.issues }
  }

  try {
    const period = await prisma.arisanPeriod.findUnique({
      where: { id: validation.data.periodId },
      include: { draws: { where: { voided: false } } },
    })

    if (!period) {
      return { error: "Periode tidak ditemukan atau sudah dihapus" }
    }

    if (period.draws.length > 0) {
      return { error: "Periode sudah di-kocok, iuran terkunci" }
    }

    const member = await prisma.member.findUnique({
      where: { id: validation.data.memberId },
      select: { id: true, headOfHouseholdId: true },
    })

    if (!member) {
      return { error: "Anggota tidak ditemukan" }
    }

    if (member.headOfHouseholdId != null) {
      return {
        error: "Anggota ini ikut rumah lain — bayar lewat kepala rumah",
      }
    }

    const incomeId = crypto.randomUUID()
    await prisma.$transaction([
      prisma.arisanIncome.create({
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
      prisma.arisanPeriod.update({
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
          entity: "arisanIncome",
          entityId: incomeId,
          summary: "Mencatat iuran arisan",
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

    revalidatePath("/dashboard/arisan")
    return { success: true }
  } catch (error) {
    console.error("Failed to create arisan income:", error)
    const prismaError = error as { code?: string }

    if (prismaError.code === "P2002") {
      return { error: "Anggota ini sudah tercatat bayar di periode ini" }
    }

    if (prismaError.code === "P2003") {
      return { error: "Data periode atau anggota tidak valid" }
    }

    if (prismaError.code === "P2001" || prismaError.code === "P2025") {
      return { error: "Database tidak dapat diakses, coba lagi nanti" }
    }

    return { error: "Gagal mencatat iuran arisan" }
  }
}
