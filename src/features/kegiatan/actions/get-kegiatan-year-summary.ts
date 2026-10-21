"use server"

import { z } from "zod"
import prisma from "@/lib/prisma"

const yearSchema = z.number().int().min(2020).max(2100)

export interface KegiatanYearSummary {
  kegiatanCount: number
  totalExpected: number // Σ(iuran disepakati per peserta; patungan bisa < feePerPerson)
  totalCollected: number
  totalExpense: number // KegiatanExpense + CashExpense tertaut
}

export interface GetKegiatanYearSummaryResult {
  success: boolean
  data?: KegiatanYearSummary
  error?: string
}

export async function getKegiatanYearSummary(
  year: number
): Promise<GetKegiatanYearSummaryResult> {
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
        id: true,
        feePerPerson: true,
        participants: { select: { expectedAmount: true } },
        payments: { select: { amount: true } },
        expenses: { select: { amount: true } },
        relatedCashExpenses: { select: { amount: true } },
      },
    })

    let totalExpected = 0
    let totalCollected = 0
    let totalExpense = 0

    for (const k of kegiatanList) {
      totalExpected += k.participants.reduce(
        (s, p) => s + (p.expectedAmount ?? k.feePerPerson),
        0
      )
      totalCollected += k.payments.reduce((s, p) => s + p.amount, 0)
      totalExpense +=
        k.expenses.reduce((s, e) => s + e.amount, 0) +
        k.relatedCashExpenses.reduce((s, e) => s + e.amount, 0)
    }

    return {
      success: true,
      data: {
        kegiatanCount: kegiatanList.length,
        totalExpected,
        totalCollected,
        totalExpense,
      },
    }
  }
  catch (error) {
    console.error("Failed to fetch kegiatan year summary:", error)
    return { success: false, error: "Gagal memuat ringkasan kegiatan" }
  }
}
