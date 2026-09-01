"use server"

import { z } from "zod"
import prisma from "@/lib/prisma"

export interface ArisanYearChartPoint {
  month: number
  totalIncome: number
  totalExpense: number
}

export interface GetArisanYearChartResult {
  success: boolean
  data?: ArisanYearChartPoint[]
  error?: string
}

const yearSchema = z.number().int().min(2020).max(2100)

export async function getArisanYearChart(
  year: number
): Promise<GetArisanYearChartResult> {
  const validation = yearSchema.safeParse(year)
  if (!validation.success) {
    return { success: false, error: "Tahun tidak valid" }
  }

  try {
    const periods = await prisma.arisanPeriod.findMany({
      where: { year: validation.data },
      select: { id: true, month: true },
    })

    const periodIds = periods.map((p) => p.id)

    const [incomeByPeriod, payoutByPeriod] = await Promise.all([
      prisma.arisanIncome.groupBy({
        by: ["periodId"],
        where: { periodId: { in: periodIds } },
        _sum: { amount: true },
      }),
      prisma.arisanDraw.groupBy({
        by: ["periodId"],
        where: { periodId: { in: periodIds }, voided: false },
        _sum: { payoutAmount: true },
      }),
    ])

    const monthByPeriodId = new Map(
      periods.map((p) => [p.id, p.month] as const)
    )
    const incomeByMonth = new Map<number, number>()
    const payoutByMonth = new Map<number, number>()

    for (const row of incomeByPeriod) {
      const month = monthByPeriodId.get(row.periodId)
      if (month != null) {
        incomeByMonth.set(month, row._sum.amount ?? 0)
      }
    }
    for (const row of payoutByPeriod) {
      const month = monthByPeriodId.get(row.periodId)
      if (month != null) {
        payoutByMonth.set(month, row._sum.payoutAmount ?? 0)
      }
    }

    const data: ArisanYearChartPoint[] = Array.from(
      { length: 12 },
      (_, i) => ({
        month: i + 1,
        totalIncome: incomeByMonth.get(i + 1) ?? 0,
        totalExpense: payoutByMonth.get(i + 1) ?? 0,
      })
    )

    return { success: true, data }
  } catch (error) {
    console.error("Failed to fetch arisan year chart:", error)
    return { success: false, error: "Gagal memuat grafik arisan tahunan" }
  }
}
