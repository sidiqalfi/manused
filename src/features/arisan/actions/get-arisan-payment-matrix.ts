"use server"

import { z } from "zod"
import prisma from "@/lib/prisma"

export interface ArisanPaymentMatrixMember {
  id: string
  name: string
  fullName: string
}

export interface ArisanPaymentMatrixMonth {
  /** 1–12 */
  month: number
  /** memberId -> total iuran bulan itu */
  paidBy: Record<string, number>
  /** Nominal iuran wajib bulan itu (untuk hitung tunggakan) */
  expected: number
}

export interface ArisanPaymentMatrix {
  members: ArisanPaymentMatrixMember[]
  months: ArisanPaymentMatrixMonth[]
}

export interface GetArisanPaymentMatrixResult {
  success: boolean
  data?: ArisanPaymentMatrix
  error?: string
}

const yearSchema = z.number().int().min(2020).max(2100)

export async function getArisanPaymentMatrix(
  year: number
): Promise<GetArisanPaymentMatrixResult> {
  const validation = yearSchema.safeParse(year)
  if (!validation.success) {
    return { success: false, error: "Tahun tidak valid" }
  }

  try {
    const [periods, members] = await Promise.all([
      prisma.arisanPeriod.findMany({
        where: { year: validation.data },
        select: { id: true, month: true, contributionAmount: true },
        orderBy: { month: "asc" },
      }),
      prisma.member.findMany({
        where: {
          headOfHouseholdId: null,
          // Slot = keluarga: head inactive tetap tampil selama rumahnya
          // masih punya anggota aktif.
          OR: [
            { status: "ACTIVE" },
            { householdMembers: { some: { status: "ACTIVE" } } },
          ],
        },
        select: { id: true, name: true, fullName: true },
        orderBy: { name: "asc" },
      }),
    ])

    const periodIds = periods.map((p) => p.id)

    const incomes = periodIds.length
      ? await prisma.arisanIncome.findMany({
          where: { periodId: { in: periodIds } },
          select: { periodId: true, memberId: true, amount: true },
        })
      : []

    const periodToMonth = new Map(periods.map((p) => [p.id, p.month]))

    const byMonth = new Map<number, Map<string, number>>()
    for (const income of incomes) {
      const month = periodToMonth.get(income.periodId)
      if (month === undefined) continue

      let memberTotals = byMonth.get(month)
      if (!memberTotals) {
        memberTotals = new Map()
        byMonth.set(month, memberTotals)
      }
      memberTotals.set(
        income.memberId,
        (memberTotals.get(income.memberId) ?? 0) + income.amount
      )
    }

    const months: ArisanPaymentMatrixMonth[] = Array.from(
      byMonth.keys()
    )
      .sort((a, b) => a - b)
      .map((month) => {
        const paidBy: Record<string, number> = {}
        for (const [memberId, amount] of byMonth.get(month)!) {
          paidBy[memberId] = amount
        }
        const expected =
          periods.find((p) => p.month === month)?.contributionAmount ?? 0
        return { month, paidBy, expected }
      })

    return {
      success: true,
      data: { members, months },
    }
  } catch (error) {
    console.error("Failed to fetch arisan payment matrix:", error)
    return { success: false, error: "Gagal memuat matrix pembayaran" }
  }
}
