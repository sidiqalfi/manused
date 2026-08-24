"use server"

import { z } from "zod"
import prisma from "@/lib/prisma"

export interface SosialYearChartDataPoint {
  month: number
  totalIncome: number
  totalExpense: number
}

export interface GetSosialYearChartResult {
  success: boolean
  data?: SosialYearChartDataPoint[]
  error?: string
}

const yearSchema = z.number().int().min(2020).max(2100)

export async function getSosialYearChart(
  year: number
): Promise<GetSosialYearChartResult> {
  const validation = yearSchema.safeParse(year)
  if (!validation.success) {
    return { success: false, error: "Tahun tidak valid" }
  }

  try {
    const periods = await prisma.sosialPeriod.findMany({
      where: { year: validation.data },
      select: { id: true, month: true },
    })

    const periodIds = periods.map((p) => p.id)

    const [incomeByPeriod, expenseByPeriod] = await Promise.all([
      prisma.sosialIncome.groupBy({
        by: ["periodId"],
        where: { periodId: { in: periodIds } },
        _sum: { amount: true },
      }),
      prisma.sosialExpense.groupBy({
        by: ["periodId"],
        where: { periodId: { in: periodIds } },
        _sum: { amount: true },
      }),
    ])

    const monthByPeriodId = new Map(
      periods.map((p) => [p.id, p.month] as const)
    )
    const incomeByMonth = new Map<number, number>()
    const expenseByMonth = new Map<number, number>()

    for (const row of incomeByPeriod) {
      const month = monthByPeriodId.get(row.periodId)
      if (month != null) {
        incomeByMonth.set(month, row._sum.amount ?? 0)
      }
    }
    for (const row of expenseByPeriod) {
      const month = monthByPeriodId.get(row.periodId)
      if (month != null) {
        expenseByMonth.set(month, row._sum.amount ?? 0)
      }
    }

    const data: SosialYearChartDataPoint[] = Array.from(
      { length: 12 },
      (_, i) => ({
        month: i + 1,
        totalIncome: incomeByMonth.get(i + 1) ?? 0,
        totalExpense: expenseByMonth.get(i + 1) ?? 0,
      })
    )

    return { success: true, data }
  } catch (error) {
    console.error("Failed to fetch sosial year chart:", error)
    return { success: false, error: "Gagal memuat grafik sosial tahunan" }
  }
}
