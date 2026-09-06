"use server"

import { z } from "zod"
import prisma from "@/lib/prisma"

export interface ArisanYearDrawItem {
  id: string
  winnerName: string
  cycleNumber: number
  collectedAmount: number
  payoutAmount: number
  savingsAfter: number
  drawnAt: Date
  voided: boolean
  period: {
    month: number
    year: number
  }
}

export interface GetArisanYearDrawsResult {
  success: boolean
  data?: ArisanYearDrawItem[]
  error?: string
}

const yearSchema = z.number().int().min(2020).max(2100)

export async function getArisanYearDraws(
  year: number
): Promise<GetArisanYearDrawsResult> {
  const validation = yearSchema.safeParse(year)
  if (!validation.success) {
    return { success: false, error: "Tahun tidak valid" }
  }

  try {
    const draws = await prisma.arisanDraw.findMany({
      where: { period: { year: validation.data } },
      include: {
        winnerMember: { select: { name: true } },
        period: { select: { month: true, year: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return {
      success: true,
      data: draws.map((d) => ({
        id: d.id,
        winnerName: d.winnerMember.name,
        cycleNumber: d.cycleNumber,
        collectedAmount: d.collectedAmount,
        payoutAmount: d.payoutAmount,
        savingsAfter: d.savingsAfter,
        drawnAt: d.drawnAt,
        voided: d.voided,
        period: {
          month: d.period.month,
          year: d.period.year,
        },
      })),
    }
  } catch (error) {
    console.error("Failed to fetch arisan year draws:", error)
    return { success: false, error: "Gagal memuat riwayat kocokan" }
  }
}
