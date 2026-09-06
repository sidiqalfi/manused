"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import {
  ARISAN_INITIAL_SAVE_KEY,
  getPerformArisanDrawFormValues,
  performArisanDrawSchema,
} from "../arisan-schemas"
import {
  currentCycle,
  eligibleMembers,
  hasActiveDraw,
  savings,
  winnersInCycle,
} from "../draw-logic"
import { revalidatePath } from "next/cache"

export async function performArisanDraw(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const data = getPerformArisanDrawFormValues(formData)
  const validation = performArisanDrawSchema.safeParse(data)

  if (!validation.success) {
    return { error: "Data tidak valid", details: validation.error.issues }
  }

  try {
    const period = await prisma.arisanPeriod.findUnique({
      where: { id: validation.data.periodId },
      include: { incomes: true, draws: true },
    })

    if (!period) {
      return { error: "Periode tidak ditemukan" }
    }

    if (hasActiveDraw(period.draws)) {
      return { error: "Periode sudah di-kocok" }
    }

    const paidMemberIds = period.incomes.map((i) => i.memberId)

    const history = await prisma.arisanDraw.findMany({
      select: {
        winnerMemberId: true,
        cycleNumber: true,
        collectedAmount: true,
        payoutAmount: true,
        voided: true,
      },
    })

    const [activeMembers, setting] = await Promise.all([
      prisma.member.findMany({
        where: {
          id: { in: paidMemberIds },
          status: "ACTIVE",
          headOfHouseholdId: null,
        },
        select: { id: true },
      }),
      prisma.appSetting.findUnique({
        where: { key: ARISAN_INITIAL_SAVE_KEY },
      }),
    ])

    let cycle = currentCycle(history)
    let pool = eligibleMembers(
      activeMembers.map((m) => m.id),
      paidMemberIds,
      winnersInCycle(history, cycle)
    )

    if (pool.length === 0) {
      cycle += 1
      pool = eligibleMembers(
        activeMembers.map((m) => m.id),
        paidMemberIds,
        winnersInCycle(history, cycle)
      )
    }

    if (pool.length === 0) {
      return { error: "Tidak ada anggota yang bisa di-kocok" }
    }

    if (!pool.includes(validation.data.winnerMemberId)) {
      return { error: "Anggota tidak memenuhi syarat untuk di-kocok" }
    }

    const collectedAmount = period.incomes.reduce((sum, i) => sum + i.amount, 0)
    const payoutAmount = period.payoutTarget
    const initialSave = setting ? Number(setting.value) : 0
    const savingsAfter =
      savings(initialSave, history) + collectedAmount - payoutAmount

    await prisma.arisanDraw.create({
      data: {
        periodId: validation.data.periodId,
        winnerMemberId: validation.data.winnerMemberId,
        cycleNumber: cycle,
        collectedAmount,
        payoutAmount,
        savingsAfter,
        drawnAt: validation.data.drawnAt,
        createdById: session.user.id,
      },
    })

    revalidatePath("/dashboard/arisan")
    return { success: true }
  } catch (error) {
    console.error("Failed to perform arisan draw:", error)
    const prismaError = error as { code?: string }

    if (prismaError.code === "P2003") {
      return { error: "Data periode atau anggota tidak valid" }
    }

    return { error: "Gagal menyimpan hasil kocokan" }
  }
}
