"use server"

import prisma from "@/lib/prisma"
import { cashPeriodIdSchema } from "../cash-schemas"

export interface CashSummaryData {
  totalIncome: number
  totalExpense: number
  balance: number
  incomeCount: number
  expenseCount: number
  duesAmount: number
  minAmount: number
}

export interface GetCashSummaryResult {
  success: boolean
  data?: CashSummaryData
  error?: string
}

export async function getCashSummary(
  periodId: string
): Promise<GetCashSummaryResult> {
  const validation = cashPeriodIdSchema.safeParse(periodId)
  if (!validation.success) {
    return { success: false, error: "ID periode tidak valid" }
  }

  try {
    const period = await prisma.cashPeriod.findUnique({
      where: { id: validation.data },
    })

    if (!period) {
      return { success: false, error: "Periode tidak ditemukan" }
    }

    const totalIncome = await prisma.cashIncome.aggregate({
      where: { periodId },
      _sum: { amount: true },
      _count: true,
    })

    const totalExpense = await prisma.cashExpense.aggregate({
      where: { periodId },
      _sum: { amount: true },
      _count: true,
    })

    const income = totalIncome._sum.amount ?? 0
    const expense = totalExpense._sum.amount ?? 0
    const balance = income - expense

    return {
      success: true,
      data: {
        totalIncome: income,
        totalExpense: expense,
        balance,
        incomeCount: totalIncome._count,
        expenseCount: totalExpense._count,
        duesAmount: period.duesAmount,
        minAmount: period.minAmount,
      },
    }
  } catch (error) {
    console.error("Failed to fetch cash summary:", error)
    return { success: false, error: "Gagal memuat ringkasan kas" }
  }
}
