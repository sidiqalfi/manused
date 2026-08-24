"use server"

import { z } from "zod"
import prisma from "@/lib/prisma"

export interface SosialYearSummaryData {
  year: number
  totalIncome: number
  totalExpense: number
  balance: number
  incomeCount: number
  expenseCount: number
}

export interface GetSosialYearSummaryResult {
  success: boolean
  data?: SosialYearSummaryData
  error?: string
}

const yearSchema = z.number().int().min(2020).max(2100)

export async function getSosialYearSummary(
  year: number
): Promise<GetSosialYearSummaryResult> {
  const validation = yearSchema.safeParse(year)
  if (!validation.success) {
    return { success: false, error: "Tahun tidak valid" }
  }

  try {
    const [income, expense] = await Promise.all([
      prisma.sosialIncome.aggregate({
        where: { period: { year: validation.data } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.sosialExpense.aggregate({
        where: { period: { year: validation.data } },
        _sum: { amount: true },
        _count: true,
      }),
    ])

    const totalIncome = income._sum.amount ?? 0
    const totalExpense = expense._sum.amount ?? 0

    return {
      success: true,
      data: {
        year: validation.data,
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        incomeCount: income._count,
        expenseCount: expense._count,
      },
    }
  } catch (error) {
    console.error("Failed to fetch sosial year summary:", error)
    return { success: false, error: "Gagal memuat rekap sosial tahunan" }
  }
}
