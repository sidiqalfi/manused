"use server"

import prisma from "@/lib/prisma"

export async function getCashPeriods() {
  try {
    const periods = await prisma.cashPeriod.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
    })
    return periods
  } catch (error) {
    console.error("Failed to fetch cash periods:", error)
    return []
  }
}

export async function getCashPeriod(periodId: string) {
  try {
    const period = await prisma.cashPeriod.findUnique({
      where: { id: periodId },
      include: {
        incomes: {
          include: { member: true },
          orderBy: { paidAt: "asc" },
        },
        expenses: {
          orderBy: { spentAt: "asc" },
        },
      },
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
