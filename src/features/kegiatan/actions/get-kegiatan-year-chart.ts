"use server"

import { z } from "zod"
import prisma from "@/lib/prisma"
import type { YearlyFlowPoint } from "@/components/yearly-income-expense-chart"

const yearSchema = z.number().int().min(2020).max(2100)

export interface GetKegiatanYearChartResult {
  success: boolean
  data?: YearlyFlowPoint[]
  error?: string
}

export async function getKegiatanYearChart(
  year: number
): Promise<GetKegiatanYearChartResult> {
  const validation = yearSchema.safeParse(year)
  if (!validation.success) {
    return { success: false, error: "Tahun tidak valid" }
  }

  try {
    const kegiatanList = await prisma.kegiatan.findMany({
      where: {
        eventDate: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
        },
      },
      select: {
        eventDate: true,
        payments: { select: { amount: true, paidAt: true } },
        expenses: { select: { amount: true, spentAt: true } },
        relatedCashExpenses: { select: { amount: true, spentAt: true } },
      },
    })

    const monthly = new Map<number, { income: number; expense: number }>()
    for (let m = 1; m <= 12; m++) {
      monthly.set(m, { income: 0, expense: 0 })
    }

    for (const k of kegiatanList) {
      for (const p of k.payments) {
        const m = p.paidAt.getUTCMonth() + 1
        const bucket = monthly.get(m)
        if (bucket) bucket.income += p.amount
      }
      for (const e of k.expenses) {
        const m = e.spentAt.getUTCMonth() + 1
        const bucket = monthly.get(m)
        if (bucket) bucket.expense += e.amount
      }
      for (const e of k.relatedCashExpenses) {
        const m = e.spentAt.getUTCMonth() + 1
        const bucket = monthly.get(m)
        if (bucket) bucket.expense += e.amount
      }
    }

    const data: YearlyFlowPoint[] = Array.from(monthly.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([month, v]) => ({
        month,
        totalIncome: v.income,
        totalExpense: v.expense,
      }))

    return { success: true, data }
  }
  catch (error) {
    console.error("Failed to fetch kegiatan year chart:", error)
    return { success: false, error: "Gagal memuat grafik kegiatan" }
  }
}
