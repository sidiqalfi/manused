"use server"

import prisma from "@/lib/prisma"
import { ARISAN_INITIAL_SAVE_KEY } from "../arisan-schemas"
import { savings } from "../draw-logic"

export interface ArisanOverviewData {
  savings: number
  lastWinnerName: string | null
  initialSave: number
}

export interface GetArisanOverviewResult {
  success: boolean
  data?: ArisanOverviewData
  error?: string
}

export async function getArisanOverview(): Promise<GetArisanOverviewResult> {
  try {
    const [draws, setting, lastDraw] = await Promise.all([
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
      prisma.arisanDraw.findFirst({
        where: { voided: false },
        orderBy: { createdAt: "desc" },
        select: { winnerMember: { select: { name: true } } },
      }),
    ])

    const initialSave = setting ? Number(setting.value) : 0

    return {
      success: true,
      data: {
        savings: savings(initialSave, draws),
        lastWinnerName: lastDraw?.winnerMember.name ?? null,
        initialSave,
      },
    }
  } catch (error) {
    console.error("Failed to fetch arisan overview:", error)
    return { success: false, error: "Gagal memuat ringkasan arisan" }
  }
}
