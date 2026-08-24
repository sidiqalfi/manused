"use server"

import { z } from "zod"
import prisma from "@/lib/prisma"

export interface CashYearSummaryData {
  year: number
  totalIncome: number
  totalExpense: number
  balance: number
  incomeCount: number
  expenseCount: number
}

export interface GetCashYearSummaryResult {
  success: boolean
  data?: CashYearSummaryData
  error?: string
}

const yearSchema = z.number().int().min(2020).max(2100)

export async function getCashYearSummary(
  year: number
): Promise<GetCashYearSummaryResult> {
  const validation = yearSchema.safeParse(year)
  if (!validation.success) {
    return { success: false, error: "Tahun tidak valid" }
  }

  try {
    const [income, expense] = await Promise.all([
      prisma.cashIncome.aggregate({
        where: { period: { year: validation.data } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.cashExpense.aggregate({
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
    console.error("Failed to fetch cash year summary:", error)
    return { success: false, error: "Gagal memuat rekap kas tahunan" }
  }
}
