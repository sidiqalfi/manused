"use server"

import { z } from "zod"
import prisma from "@/lib/prisma"
import type {
  ArisanPaymentMatrix,
  GetArisanPaymentMatrixResult,
} from "@/features/arisan/actions/get-arisan-payment-matrix"

export type PaymentMatrix = ArisanPaymentMatrix
export type GetPaymentMatrixResult = GetArisanPaymentMatrixResult

const yearSchema = z.number().int().min(2020).max(2100)

async function buildPaymentMatrix(
  kind: "cash" | "sosial",
  year: number
): Promise<GetPaymentMatrixResult> {
  const validation = yearSchema.safeParse(year)
  if (!validation.success) {
    return { success: false, error: "Tahun tidak valid" }
  }

  try {
    const periods =
      kind === "cash"
        ? await prisma.cashPeriod.findMany({
            where: { year: validation.data },
            select: { id: true, month: true },
            orderBy: { month: "asc" },
          })
        : await prisma.sosialPeriod.findMany({
            where: { year: validation.data },
            select: { id: true, month: true },
            orderBy: { month: "asc" },
          })

    const periodIds = periods.map((p) => p.id)

    const incomes = periodIds.length
      ? kind === "cash"
        ? await prisma.cashIncome.findMany({
            where: { periodId: { in: periodIds } },
            select: { periodId: true, memberId: true, amount: true },
          })
        : await prisma.sosialIncome.findMany({
            where: { periodId: { in: periodIds } },
            select: { periodId: true, memberId: true, amount: true },
          })
      : []

    const members = await prisma.member.findMany({
      where: { status: "ACTIVE", headOfHouseholdId: null },
      select: { id: true, name: true, fullName: true },
      orderBy: { name: "asc" },
    })

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

    const months = Array.from(byMonth.keys())
      .sort((a, b) => a - b)
      .map((month) => {
        const paidBy: Record<string, number> = {}
        for (const [memberId, amount] of byMonth.get(month)!) {
          paidBy[memberId] = amount
        }
        return { month, paidBy }
      })

    return { success: true, data: { members, months } }
  } catch (error) {
    console.error(`Failed to fetch ${kind} payment matrix:`, error)
    return { success: false, error: "Gagal memuat matrix pembayaran" }
  }
}

export async function getCashPaymentMatrix(
  year: number
): Promise<GetPaymentMatrixResult> {
  return buildPaymentMatrix("cash", year)
}

export async function getSosialPaymentMatrix(
  year: number
): Promise<GetPaymentMatrixResult> {
  return buildPaymentMatrix("sosial", year)
}
