"use server"

import prisma from "@/lib/prisma"
import { sosialPeriodIdSchema } from "../sosial-schemas"

export interface SosialSummaryData {
  totalIncome: number
  totalExpense: number
  balance: number
  incomeCount: number
  expenseCount: number
  minAmount: number
}

export interface GetSosialSummaryResult {
  success: boolean
  data?: SosialSummaryData
  error?: string
}

export async function getSosialSummary(
  periodId: string
): Promise<GetSosialSummaryResult> {
  const validation = sosialPeriodIdSchema.safeParse(periodId)
  if (!validation.success) {
    return { success: false, error: "ID periode tidak valid" }
  }

  try {
    const period = await prisma.sosialPeriod.findUnique({
      where: { id: validation.data },
    })

    if (!period) {
      return { success: false, error: "Periode tidak ditemukan" }
    }

    const totalIncome = await prisma.sosialIncome.aggregate({
      where: { periodId },
      _sum: { amount: true },
      _count: true,
    })

    const totalExpense = await prisma.sosialExpense.aggregate({
      where: { periodId },
      _sum: { amount: true },
      _count: true,
    })

    const income = totalIncome._sum.amount ?? 0
    const expense = totalExpense._sum.amount ?? 0

    return {
      success: true,
      data: {
        totalIncome: income,
        totalExpense: expense,
        balance: income - expense,
        incomeCount: totalIncome._count,
        expenseCount: totalExpense._count,
        minAmount: period.minAmount,
      },
    }
  } catch (error) {
    console.error("Failed to fetch sosial summary:", error)
    return { success: false, error: "Gagal memuat ringkasan sosial" }
  }
}
