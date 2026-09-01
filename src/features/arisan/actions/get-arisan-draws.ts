"use server"

import prisma from "@/lib/prisma"
import { arisanPeriodIdSchema } from "../arisan-schemas"

export interface ArisanDrawItem {
  id: string
  winnerMemberId: string
  winnerName: string
  cycleNumber: number
  collectedAmount: number
  payoutAmount: number
  savingsAfter: number
  drawnAt: Date
  voided: boolean
}

export interface GetArisanDrawsResult {
  success: boolean
  data?: ArisanDrawItem[]
  error?: string
}

export async function getArisanDraws(
  periodId: string
): Promise<GetArisanDrawsResult> {
  const validation = arisanPeriodIdSchema.safeParse(periodId)
  if (!validation.success) {
    return { success: false, error: "ID periode tidak valid" }
  }

  try {
    const draws = await prisma.arisanDraw.findMany({
      where: { periodId: validation.data },
      include: { winnerMember: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    })

    return {
      success: true,
      data: draws.map((d) => ({
        id: d.id,
        winnerMemberId: d.winnerMemberId,
        winnerName: d.winnerMember.name,
        cycleNumber: d.cycleNumber,
        collectedAmount: d.collectedAmount,
        payoutAmount: d.payoutAmount,
        savingsAfter: d.savingsAfter,
        drawnAt: d.drawnAt,
        voided: d.voided,
      })),
    }
  } catch (error) {
    console.error("Failed to fetch arisan draws:", error)
    return { success: false, error: "Gagal memuat riwayat kocokan" }
  }
}
