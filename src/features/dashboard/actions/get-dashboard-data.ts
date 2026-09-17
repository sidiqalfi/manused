"use server"

import prisma from "@/lib/prisma"
import { CASH_INITIAL_BALANCE_KEY } from "@/features/cash/cash-schemas"
import { SOSIAL_INITIAL_BALANCE_KEY } from "@/features/sosial/sosial-schemas"
import { ARISAN_INITIAL_SAVE_KEY } from "@/features/arisan/arisan-schemas"
import { netSavings } from "@/features/arisan/draw-logic"

// ---------------------------------------------------------------------------
// getDashboardData — one round-trip for everything the Dashboard needs.
//
// Replaces the 15 individual server actions the dashboard used to fire
// (periods + latest period details + summary + year chart + year summary for
// cash/sosial/arisan + members + arisan overview), each of which paid its own
// serverless↔Neon connection cost and produced a ~15s first load in prod.
// ---------------------------------------------------------------------------

export interface DashboardYearSummary {
  year: number
  totalIncome: number
  totalExpense: number
  balance: number
  initialBalance: number
}

export interface DashboardYearChartPoint {
  month: number
  totalIncome: number
  totalExpense: number
}

export interface DashboardSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  incomeCount: number
  expenseCount: number
  duesAmount: number
  minAmount: number
  initialBalance: number
}

export interface DashboardSosialSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  incomeCount: number
  expenseCount: number
  minAmount: number
  initialBalance: number
}

export interface DashboardArisanOverview {
  savings: number
  lastWinnerName: string | null
  initialSave: number
}

export interface DashboardMember {
  id: string
  name: string
  fullName: string
  status: string
  headOfHouseholdId: string | null
  gender: string
  birthDate: string
  address: string
  rt: string
  rw: string
  phone: string | null
  createdAt: string
}

export interface DashboardPeriodOption {
  id: string
  month: number
  year: number
  duesAmount?: number
  minAmount?: number
  contributionAmount?: number
  payoutTarget?: number
}

export interface DashboardIncomeRow {
  id: string
  memberId: string
  amount: number
  paidAt: string
  note: string | null
  memberName: string
}

export interface DashboardExpenseRow {
  id: string
  description: string
  amount: number
  spentAt: string
}

export interface DashboardCashDetails {
  period: DashboardPeriodOption
  incomes: DashboardIncomeRow[]
  expenses: DashboardExpenseRow[]
}

export interface DashboardSosialDetails {
  period: DashboardPeriodOption
  incomes: DashboardIncomeRow[]
  expenses: DashboardExpenseRow[]
}

export interface DashboardArisanDetails {
  period: DashboardPeriodOption
  incomes: DashboardIncomeRow[]
  hasActiveDraw: boolean
}

export interface DashboardData {
  periods: {
    cash: DashboardPeriodOption[]
    sosial: DashboardPeriodOption[]
    arisan: DashboardPeriodOption[]
  }
  latest: {
    cash: DashboardCashDetails | null
    sosial: DashboardSosialDetails | null
    arisan: DashboardArisanDetails | null
  }
  summaries: {
    cash: DashboardSummary | null
    sosial: DashboardSosialSummary | null
  }
  yearSummaries: {
    cash: DashboardYearSummary | null
    sosial: DashboardYearSummary | null
  }
  yearCharts: {
    cash: DashboardYearChartPoint[]
    sosial: DashboardYearChartPoint[]
    arisan: DashboardYearChartPoint[]
  }
  members: DashboardMember[]
  arisanOverview: DashboardArisanOverview | null
}

export interface GetDashboardDataResult {
  success: boolean
  data?: DashboardData
  error?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toChart(
  rows: { month: number; income: number; expense: number }[]
): DashboardYearChartPoint[] {
  const byMonth = new Map(rows.map((r) => [r.month, r]))
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    totalIncome: byMonth.get(i + 1)?.income ?? 0,
    totalExpense: byMonth.get(i + 1)?.expense ?? 0,
  }))
}

function sumRows(rows: { amount: number }[]): number {
  return rows.reduce((s, r) => s + r.amount, 0)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function getDashboardData(): Promise<GetDashboardDataResult> {
  try {
    const year = new Date().getFullYear()

    // ---- step 1: period lists, members, arisan overview (all parallel) ----
    const [cashPeriods, sosialPeriods, arisanPeriods, members, arisanOverview] =
      await Promise.all([
        prisma.cashPeriod.findMany({
          orderBy: [{ year: "desc" }, { month: "desc" }],
        }),
        prisma.sosialPeriod.findMany({
          orderBy: [{ year: "desc" }, { month: "desc" }],
        }),
        prisma.arisanPeriod.findMany({
          orderBy: [{ year: "desc" }, { month: "desc" }],
        }),
        prisma.member.findMany({ orderBy: { createdAt: "desc" } }),
        (async () => {
          const [draws, setting, lastDraw, incomeAgg] = await Promise.all([
            prisma.arisanDraw.findMany({
              select: { payoutAmount: true, voided: true },
            }),
            prisma.appSetting.findUnique({ where: { key: ARISAN_INITIAL_SAVE_KEY } }),
            prisma.arisanDraw.findFirst({
              where: { voided: false },
              orderBy: { createdAt: "desc" },
              select: { winnerMember: { select: { name: true } } },
            }),
            prisma.arisanIncome.aggregate({ _sum: { amount: true } }),
          ])
          const initialSave = setting ? Number(setting.value) : 0
          const totalPayout = draws
            .filter((d) => !d.voided)
            .reduce((s, d) => s + d.payoutAmount, 0)
          return {
            savings: netSavings(initialSave, incomeAgg._sum.amount ?? 0, totalPayout),
            lastWinnerName: lastDraw?.winnerMember.name ?? null,
            initialSave,
          }
        })(),
      ])

    const latestCashId = cashPeriods[0]?.id ?? null
    const latestSosialId = sosialPeriods[0]?.id ?? null
    const latestArisanId = arisanPeriods[0]?.id ?? null

    // ---- step 2: latest-period details + yearly aggregates (parallel) -----
    const [
      cashIncomes,
      cashExpenses,
      cashIncomeAgg,
      cashExpenseAgg,
      cashSetting,
      sosialIncomes,
      sosialExpenses,
      sosialIncomeAgg,
      sosialExpenseAgg,
      sosialSetting,
      arisanIncomes,
      arisanActiveDraw,
      cashYearPeriods,
      sosialYearPeriods,
      arisanYearPeriods,
      cashYearIncome,
      cashYearExpense,
      sosialYearIncome,
      sosialYearExpense,
    ] = await Promise.all([
      latestCashId
        ? prisma.cashIncome.findMany({
            where: { periodId: latestCashId },
            include: { member: { select: { name: true } } },
            orderBy: { paidAt: "asc" },
          })
        : [],
      latestCashId
        ? prisma.cashExpense.findMany({
            where: { periodId: latestCashId },
            orderBy: { spentAt: "asc" },
          })
        : [],
      latestCashId
        ? prisma.cashIncome.aggregate({
            where: { periodId: latestCashId },
            _sum: { amount: true },
            _count: true,
          })
        : null,
      latestCashId
        ? prisma.cashExpense.aggregate({
            where: { periodId: latestCashId },
            _sum: { amount: true },
            _count: true,
          })
        : null,
      prisma.appSetting.findUnique({ where: { key: CASH_INITIAL_BALANCE_KEY } }),
      latestSosialId
        ? prisma.sosialIncome.findMany({
            where: { periodId: latestSosialId },
            include: { member: { select: { name: true } } },
            orderBy: { paidAt: "asc" },
          })
        : [],
      latestSosialId
        ? prisma.sosialExpense.findMany({
            where: { periodId: latestSosialId },
            orderBy: { spentAt: "asc" },
          })
        : [],
      latestSosialId
        ? prisma.sosialIncome.aggregate({
            where: { periodId: latestSosialId },
            _sum: { amount: true },
            _count: true,
          })
        : null,
      latestSosialId
        ? prisma.sosialExpense.aggregate({
            where: { periodId: latestSosialId },
            _sum: { amount: true },
            _count: true,
          })
        : null,
      prisma.appSetting.findUnique({ where: { key: SOSIAL_INITIAL_BALANCE_KEY } }),
      latestArisanId
        ? prisma.arisanIncome.findMany({
            where: { periodId: latestArisanId },
            include: { member: { select: { name: true } } },
            orderBy: { paidAt: "asc" },
          })
        : [],
      latestArisanId
        ? prisma.arisanDraw.findFirst({
            where: { periodId: latestArisanId, voided: false },
            select: { id: true },
          })
        : null,
      // yearly charts + summaries
      prisma.cashPeriod.findMany({
        where: { year },
        select: {
          month: true,
          incomes: { select: { amount: true } },
          expenses: { select: { amount: true } },
        },
      }),
      prisma.sosialPeriod.findMany({
        where: { year },
        select: {
          month: true,
          incomes: { select: { amount: true } },
          expenses: { select: { amount: true } },
        },
      }),
      prisma.arisanPeriod.findMany({
        where: { year },
        select: {
          month: true,
          incomes: { select: { amount: true } },
          draws: {
            where: { voided: false },
            select: { payoutAmount: true },
          },
        },
      }),
      prisma.cashIncome.aggregate({
        where: { period: { year } },
        _sum: { amount: true },
      }),
      prisma.cashExpense.aggregate({
        where: { period: { year } },
        _sum: { amount: true },
      }),
      prisma.sosialIncome.aggregate({
        where: { period: { year } },
        _sum: { amount: true },
      }),
      prisma.sosialExpense.aggregate({
        where: { period: { year } },
        _sum: { amount: true },
      }),
    ])

    // ---- assemble ---------------------------------------------------------
    const cashInitial = cashSetting ? Number(cashSetting.value) : 0
    const sosialInitial = sosialSetting ? Number(sosialSetting.value) : 0

    const cashSummary: DashboardSummary | null = latestCashId
      ? {
          totalIncome: cashIncomeAgg?._sum.amount ?? 0,
          totalExpense: cashExpenseAgg?._sum.amount ?? 0,
          balance:
            cashInitial + (cashIncomeAgg?._sum.amount ?? 0) - (cashExpenseAgg?._sum.amount ?? 0),
          incomeCount: cashIncomeAgg?._count ?? 0,
          expenseCount: cashExpenseAgg?._count ?? 0,
          duesAmount: cashPeriods[0]?.duesAmount ?? 0,
          minAmount: cashPeriods[0]?.minAmount ?? 0,
          initialBalance: cashInitial,
        }
      : null

    const sosialSummary: DashboardSosialSummary | null = latestSosialId
      ? {
          totalIncome: sosialIncomeAgg?._sum.amount ?? 0,
          totalExpense: sosialExpenseAgg?._sum.amount ?? 0,
          balance:
            sosialInitial +
            (sosialIncomeAgg?._sum.amount ?? 0) -
            (sosialExpenseAgg?._sum.amount ?? 0),
          incomeCount: sosialIncomeAgg?._count ?? 0,
          expenseCount: sosialExpenseAgg?._count ?? 0,
          minAmount: sosialPeriods[0]?.minAmount ?? 0,
          initialBalance: sosialInitial,
        }
      : null

    const cashYearSummary: DashboardYearSummary = {
      year,
      totalIncome: cashYearIncome._sum.amount ?? 0,
      totalExpense: cashYearExpense._sum.amount ?? 0,
      balance: cashInitial + (cashYearIncome._sum.amount ?? 0) - (cashYearExpense._sum.amount ?? 0),
      initialBalance: cashInitial,
    }

    const sosialYearSummary: DashboardYearSummary = {
      year,
      totalIncome: sosialYearIncome._sum.amount ?? 0,
      totalExpense: sosialYearExpense._sum.amount ?? 0,
      balance:
        sosialInitial +
        (sosialYearIncome._sum.amount ?? 0) -
        (sosialYearExpense._sum.amount ?? 0),
      initialBalance: sosialInitial,
    }

    const data: DashboardData = {
      periods: {
        cash: cashPeriods,
        sosial: sosialPeriods,
        arisan: arisanPeriods,
      },
      latest: {
        cash: latestCashId
          ? {
              period: cashPeriods[0],
              incomes: cashIncomes.map((i) => ({
                id: i.id,
                memberId: i.memberId,
                amount: i.amount,
                paidAt: i.paidAt.toISOString(),
                note: i.note,
                memberName: i.member.name,
              })),
              expenses: cashExpenses.map((e) => ({
                id: e.id,
                description: e.description,
                amount: e.amount,
                spentAt: e.spentAt.toISOString(),
              })),
            }
          : null,
        sosial: latestSosialId
          ? {
              period: sosialPeriods[0],
              incomes: sosialIncomes.map((i) => ({
                id: i.id,
                memberId: i.memberId,
                amount: i.amount,
                paidAt: i.paidAt.toISOString(),
                note: i.note,
                memberName: i.member.name,
              })),
              expenses: sosialExpenses.map((e) => ({
                id: e.id,
                description: e.description,
                amount: e.amount,
                spentAt: e.spentAt.toISOString(),
              })),
            }
          : null,
        arisan: latestArisanId
          ? {
              period: arisanPeriods[0],
              incomes: arisanIncomes.map((i) => ({
                id: i.id,
                memberId: i.memberId,
                amount: i.amount,
                paidAt: i.paidAt.toISOString(),
                note: i.note,
                memberName: i.member.name,
              })),
              hasActiveDraw: arisanActiveDraw != null,
            }
          : null,
      },
      summaries: { cash: cashSummary, sosial: sosialSummary },
      yearSummaries: { cash: cashYearSummary, sosial: sosialYearSummary },
      yearCharts: {
        cash: toChart(
          cashYearPeriods.map((p) => ({
            month: p.month,
            income: sumRows(p.incomes),
            expense: sumRows(p.expenses),
          }))
        ),
        sosial: toChart(
          sosialYearPeriods.map((p) => ({
            month: p.month,
            income: sumRows(p.incomes),
            expense: sumRows(p.expenses),
          }))
        ),
        arisan: toChart(
          arisanYearPeriods.map((p) => ({
            month: p.month,
            income: sumRows(p.incomes),
            expense: p.draws.reduce((s, d) => s + d.payoutAmount, 0),
          }))
        ),
      },
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        fullName: m.fullName,
        status: m.status,
        headOfHouseholdId: m.headOfHouseholdId,
        gender: m.gender,
        birthDate: m.birthDate.toISOString(),
        address: m.address,
        rt: m.rt,
        rw: m.rw,
        phone: m.phone,
        createdAt: m.createdAt.toISOString(),
      })),
      arisanOverview,
    }

    return { success: true, data }
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error)
    return { success: false, error: "Gagal memuat data dashboard" }
  }
}
