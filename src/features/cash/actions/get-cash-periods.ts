"use server"

import { Prisma } from "@/generated/prisma/client"
import prisma from "@/lib/prisma"
import { cashPeriodIdSchema } from "../cash-schemas"

const periodDetailsInclude = {
  incomes: {
    include: { member: true },
    orderBy: { paidAt: "asc" },
  },
  expenses: {
    orderBy: { spentAt: "asc" },
  },
} satisfies Prisma.CashPeriodInclude

type PeriodWithDetails = Prisma.CashPeriodGetPayload<{
  include: typeof periodDetailsInclude
}>

export interface GetCashPeriodResult {
  success: boolean
  data?: PeriodWithDetails
  error?: string
}

export async function getCashPeriods() {
  try {
    const periods = await prisma.cashPeriod.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
    })
    return { success: true, data: periods }
  } catch (error) {
    console.error("Failed to fetch cash periods:", error)
    return { success: false, error: "Gagal memuat daftar periode" }
  }
}

export async function getCashPeriod(
  periodId: string
): Promise<GetCashPeriodResult> {
  const validation = cashPeriodIdSchema.safeParse(periodId)
  if (!validation.success) {
    return { success: false, error: "ID periode tidak valid" }
  }

  try {
    const period = await prisma.cashPeriod.findUnique({
      where: { id: validation.data },
      include: periodDetailsInclude,
    })

    if (!period) {
      return { success: false, error: "Periode tidak ditemukan" }
    }

    return { success: true, data: period }
  } catch (error) {
    console.error("Failed to fetch cash period:", error)
    return { success: false, error: "Gagal memuat data periode" }
  }
}
