"use server"

import prisma from "@/lib/prisma"
import { CASH_INITIAL_BALANCE_KEY, cashPeriodIdSchema } from "../cash-schemas"

export interface CashSummaryData {
  totalIncome: number
  totalExpense: number
  balance: number
  incomeCount: number
  expenseCount: number
  duesAmount: number
  minAmount: number
  initialBalance: number
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

    const setting = await prisma.appSetting.findUnique({
      where: { key: CASH_INITIAL_BALANCE_KEY },
    })
    const initialBalance = setting ? Number(setting.value) : 0

    const income = totalIncome._sum.amount ?? 0
    const expense = totalExpense._sum.amount ?? 0
    const balance = initialBalance + income - expense

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
        initialBalance,
      },
    }
  } catch (error) {
    console.error("Failed to fetch cash summary:", error)
    return { success: false, error: "Gagal memuat ringkasan kas" }
  }
}
