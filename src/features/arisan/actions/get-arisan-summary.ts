"use server"

import prisma from "@/lib/prisma"
import { ARISAN_INITIAL_SAVE_KEY, arisanPeriodIdSchema } from "../arisan-schemas"
import { savings } from "../draw-logic"

export interface ArisanSummaryData {
  collected: number
  target: number
  savings: number
  lastWinnerMemberId: string | null
  contributionAmount: number
}

export interface GetArisanSummaryResult {
  success: boolean
  data?: ArisanSummaryData
  error?: string
}

export async function getArisanSummary(
  periodId: string
): Promise<GetArisanSummaryResult> {
  const validation = arisanPeriodIdSchema.safeParse(periodId)
  if (!validation.success) {
    return { success: false, error: "ID periode tidak valid" }
  }

  try {
    const period = await prisma.arisanPeriod.findUnique({
      where: { id: validation.data },
      include: { incomes: true },
    })

    if (!period) {
      return { success: false, error: "Periode tidak ditemukan" }
    }

    const [draws, setting] = await Promise.all([
      prisma.arisanDraw.findMany({
        select: {
          winnerMemberId: true,
          cycleNumber: true,
          collectedAmount: true,
          payoutAmount: true,
          voided: true,
        },
      }),
      prisma.appSetting.findUnique({
        where: { key: ARISAN_INITIAL_SAVE_KEY },
      }),
    ])

    const active = draws.filter((d) => !d.voided)
    const collected = period.incomes.reduce((sum, i) => sum + i.amount, 0)
    const initialSave = setting ? Number(setting.value) : 0
    const lastWinner = active.at(-1)?.winnerMemberId ?? null

    return {
      success: true,
      data: {
        collected,
        target: period.payoutTarget,
        savings: savings(initialSave, draws),
        lastWinnerMemberId: lastWinner,
        contributionAmount: period.contributionAmount,
      },
    }
  } catch (error) {
    console.error("Failed to fetch arisan summary:", error)
    return { success: false, error: "Gagal memuat ringkasan arisan" }
  }
}
