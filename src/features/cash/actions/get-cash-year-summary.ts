"use server"

import { z } from "zod"
import prisma from "@/lib/prisma"
import { CASH_INITIAL_BALANCE_KEY } from "../cash-schemas"

export interface CashYearSummaryData {
  year: number
  totalIncome: number
  totalExpense: number
  balance: number
  incomeCount: number
  expenseCount: number
  initialBalance: number
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
    const [income, expense, setting] = await Promise.all([
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
      prisma.appSetting.findUnique({
        where: { key: CASH_INITIAL_BALANCE_KEY },
      }),
    ])

    const totalIncome = income._sum.amount ?? 0
    const totalExpense = expense._sum.amount ?? 0
    const initialBalance = setting ? Number(setting.value) : 0

    return {
      success: true,
      data: {
        year: validation.data,
        totalIncome,
        totalExpense,
        balance: initialBalance + totalIncome - totalExpense,
        incomeCount: income._count,
        expenseCount: expense._count,
        initialBalance,
      },
    }
  } catch (error) {
    console.error("Failed to fetch cash year summary:", error)
    return { success: false, error: "Gagal memuat rekap kas tahunan" }
  }
}
