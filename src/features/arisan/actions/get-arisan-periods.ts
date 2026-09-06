"use server"

import { Prisma } from "@/generated/prisma/client"
import prisma from "@/lib/prisma"
import { arisanPeriodIdSchema } from "../arisan-schemas"

const periodDetailsInclude = {
  incomes: {
    include: {
      member: {
        include: {
          householdMembers: {
            select: { name: true },
            orderBy: { name: "asc" },
          },
        },
      },
    },
    orderBy: { paidAt: "asc" },
  },
  draws: {
    include: { winnerMember: true },
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.ArisanPeriodInclude

type PeriodWithDetails = Prisma.ArisanPeriodGetPayload<{
  include: typeof periodDetailsInclude
}>

export interface GetArisanPeriodResult {
  success: boolean
  data?: PeriodWithDetails
  error?: string
}

export async function getArisanPeriods() {
  try {
    const periods = await prisma.arisanPeriod.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
    })
    return { success: true, data: periods }
  } catch (error) {
    console.error("Failed to fetch arisan periods:", error)
    return { success: false, error: "Gagal memuat daftar periode" }
  }
}

export async function getArisanPeriod(
  periodId: string
): Promise<GetArisanPeriodResult> {
  const validation = arisanPeriodIdSchema.safeParse(periodId)
  if (!validation.success) {
    return { success: false, error: "ID periode tidak valid" }
  }

  try {
    const period = await prisma.arisanPeriod.findUnique({
      where: { id: validation.data },
      include: periodDetailsInclude,
    })

    if (!period) {
      return { success: false, error: "Periode tidak ditemukan" }
    }

    return { success: true, data: period }
  } catch (error) {
    console.error("Failed to fetch arisan period:", error)
    return { success: false, error: "Gagal memuat data periode" }
  }
}
