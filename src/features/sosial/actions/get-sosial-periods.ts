"use server"

import { Prisma } from "@/generated/prisma/client"
import prisma from "@/lib/prisma"
import { sosialPeriodIdSchema } from "../sosial-schemas"

const periodDetailsInclude = {
  incomes: {
    include: { member: true },
    orderBy: { paidAt: "asc" },
  },
  expenses: {
    orderBy: { spentAt: "asc" },
  },
} satisfies Prisma.SosialPeriodInclude

type PeriodWithDetails = Prisma.SosialPeriodGetPayload<{
  include: typeof periodDetailsInclude
}>

export interface GetSosialPeriodResult {
  success: boolean
  data?: PeriodWithDetails
  error?: string
}

export async function getSosialPeriods() {
  try {
    const periods = await prisma.sosialPeriod.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
    })
    return { success: true, data: periods }
  } catch (error) {
    console.error("Failed to fetch sosial periods:", error)
    return { success: false, error: "Gagal memuat daftar periode" }
  }
}

export async function getSosialPeriod(
  periodId: string
): Promise<GetSosialPeriodResult> {
  const validation = sosialPeriodIdSchema.safeParse(periodId)
  if (!validation.success) {
    return { success: false, error: "ID periode tidak valid" }
  }

  try {
    const period = await prisma.sosialPeriod.findUnique({
      where: { id: validation.data },
      include: periodDetailsInclude,
    })

    if (!period) {
      return { success: false, error: "Periode tidak ditemukan" }
    }

    return { success: true, data: period }
  } catch (error) {
    console.error("Failed to fetch sosial period:", error)
    return { success: false, error: "Gagal memuat data periode" }
  }
}
