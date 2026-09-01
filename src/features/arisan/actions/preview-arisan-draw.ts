"use server"

import prisma from "@/lib/prisma"
import { arisanPeriodIdSchema } from "../arisan-schemas"
import {
  currentCycle,
  eligibleMembers,
  hasActiveDraw,
  pickWinner,
  winnersInCycle,
} from "../draw-logic"

export interface PreviewArisanDrawData {
  winnerMemberId: string
  winnerName: string
  cycleNumber: number
}

export interface PreviewArisanDrawResult {
  success: boolean
  data?: PreviewArisanDrawData
  error?: string
}

export async function previewArisanDraw(
  formData: FormData
): Promise<PreviewArisanDrawResult> {
  const periodId = String(formData.get("periodId") ?? "")
  const validation = arisanPeriodIdSchema.safeParse(periodId)
  if (!validation.success) {
    return { success: false, error: "ID periode tidak valid" }
  }

  try {
    const period = await prisma.arisanPeriod.findUnique({
      where: { id: validation.data },
      include: { incomes: true, draws: true },
    })

    if (!period) {
      return { success: false, error: "Periode tidak ditemukan" }
    }

    if (hasActiveDraw(period.draws)) {
      return { success: false, error: "Periode sudah di-kocok" }
    }

    const paidMemberIds = period.incomes.map((i) => i.memberId)
    const activeMembers = await prisma.member.findMany({
      where: { id: { in: paidMemberIds }, status: "ACTIVE" },
      select: { id: true, name: true },
    })

    const history = await prisma.arisanDraw.findMany({
      select: {
        winnerMemberId: true,
        cycleNumber: true,
        collectedAmount: true,
        payoutAmount: true,
        voided: true,
      },
    })

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
      return { success: false, error: "Tidak ada anggota yang bisa di-kocok" }
    }

    const winnerId = pickWinner(pool)
    const winner = activeMembers.find((m) => m.id === winnerId)

    return {
      success: true,
      data: {
        winnerMemberId: winnerId,
        winnerName: winner?.name ?? "",
        cycleNumber: cycle,
      },
    }
  } catch (error) {
    console.error("Failed to preview arisan draw:", error)
    return { success: false, error: "Gagal mengocok arisan" }
  }
}
