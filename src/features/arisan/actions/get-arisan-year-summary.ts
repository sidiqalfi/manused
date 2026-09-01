"use server"

import { z } from "zod"
import prisma from "@/lib/prisma"

export interface ArisanYearSummaryData {
  year: number
  totalIncome: number
  totalPayout: number
  incomeCount: number
  drawCount: number
}

export interface GetArisanYearSummaryResult {
  success: boolean
  data?: ArisanYearSummaryData
  error?: string
}

const yearSchema = z.number().int().min(2020).max(2100)

export async function getArisanYearSummary(
  year: number
): Promise<GetArisanYearSummaryResult> {
  const validation = yearSchema.safeParse(year)
  if (!validation.success) {
    return { success: false, error: "Tahun tidak valid" }
  }

  try {
    const [income, payout] = await Promise.all([
      prisma.arisanIncome.aggregate({
        where: { period: { year: validation.data } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.arisanDraw.aggregate({
        where: { period: { year: validation.data }, voided: false },
        _sum: { payoutAmount: true },
        _count: true,
      }),
    ])

    return {
      success: true,
      data: {
        year: validation.data,
        totalIncome: income._sum.amount ?? 0,
        totalPayout: payout._sum.payoutAmount ?? 0,
        incomeCount: income._count,
        drawCount: payout._count,
      },
    }
  } catch (error) {
    console.error("Failed to fetch arisan year summary:", error)
    return { success: false, error: "Gagal memuat rekap arisan tahunan" }
  }
}
