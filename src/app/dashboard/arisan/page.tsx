"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PeriodSelector, type PeriodOption } from "@/components/period-selector"
import { SummaryStatCards } from "@/components/summary-stat-cards"
import {
  YearlyIncomeExpenseChart,
  type YearlyFlowPoint,
} from "@/components/yearly-income-expense-chart"
import { CreateArisanPeriodDialog } from "@/features/arisan/components/create-arisan-period-dialog"
import { ArisanIncomeTable } from "@/features/arisan/components/arisan-income-table"
import { ArisanDrawHistory } from "@/features/arisan/components/arisan-draw-history"
import { ArisanYearDrawHistory } from "@/features/arisan/components/arisan-year-draw-history"
import { PaymentMatrixTable } from "@/components/payment-matrix-table"
import { DrawDialog } from "@/features/arisan/components/draw-dialog"
import { ManualDrawDialog } from "@/features/arisan/components/manual-draw-dialog"
import { activeSlotHeads } from "@/features/members/household"
import {
  arisanPeriodsQuery,
  arisanPeriodQuery,
  arisanSummaryQuery,
  arisanDrawsQuery,
  arisanYearSummaryQuery,
  arisanYearChartQuery,
  arisanYearDrawsQuery,
  arisanYearPaymentMatrixQuery,
  arisanOverviewQuery,
} from "@/features/arisan/queries"
import { membersQuery } from "@/features/members/queries"
import { formatCurrency } from "@/lib/format"
import { computeArrears, type MemberArrears } from "@/lib/payments/arrears"
import { Coins, Target, PiggyBank, Trophy, TrendingUp, TrendingDown } from "lucide-react"

export default function ArisanPage() {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)

  const periodsResult = useQuery(arisanPeriodsQuery).data ?? null
  const periods: PeriodOption[] = periodsResult?.success
    ? periodsResult.data ?? []
    : []
  const activeYear = periods[0]?.year ?? null

  const periodResult = useQuery(
    arisanPeriodQuery(selectedPeriodId ?? "")
  ).data ?? null
  const summaryResult = useQuery(
    arisanSummaryQuery(selectedPeriodId ?? "")
  ).data ?? null
  const drawsResult = useQuery(
    arisanDrawsQuery(selectedPeriodId ?? "")
  ).data ?? null
  const drawsLoading = useQuery(
    arisanDrawsQuery(selectedPeriodId ?? "")
  ).isPending
  const membersResult = useQuery(membersQuery).data ?? null

  const yearSummaryResult = useQuery(
    arisanYearSummaryQuery(activeYear)
  ).data ?? null
  const yearSummary = yearSummaryResult?.success
    ? yearSummaryResult.data ?? null
    : null
  const yearChartResult = useQuery(
    arisanYearChartQuery(activeYear)
  ).data ?? null
  const yearChart: YearlyFlowPoint[] = yearChartResult?.success
    ? yearChartResult.data ?? []
    : []

  const yearDrawsResult = useQuery(arisanYearDrawsQuery(activeYear)).data ?? null
  const yearDrawsLoading = useQuery(arisanYearDrawsQuery(activeYear)).isPending
  const yearDraws = yearDrawsResult?.success
    ? yearDrawsResult.data ?? []
    : null

  const paymentMatrixResult = useQuery(
    arisanYearPaymentMatrixQuery(activeYear)
  )
  const paymentMatrix = paymentMatrixResult.data?.success
    ? paymentMatrixResult.data.data ?? null
    : null
  const selectedPeriodMonth = periodResult?.success
    ? periodResult.data?.month ?? null
    : null
  const arrears =
    paymentMatrix && selectedPeriodId && selectedPeriodMonth
      ? computeArrears(paymentMatrix, activeYear ?? 0, selectedPeriodMonth)
      : new Map<string, MemberArrears>()

  const arisanOverviewResult = useQuery(arisanOverviewQuery).data ?? null
  const arisanOverview = arisanOverviewResult?.success
    ? arisanOverviewResult.data ?? null
    : null

  const summary = summaryResult?.success ? summaryResult.data ?? null : null
  const draws = drawsResult?.success ? drawsResult.data ?? [] : null

  const membersData = membersResult?.success ? membersResult.data ?? [] : []
  const activeSlots = activeSlotHeads(membersData)
  const activeHeadCount = activeSlots.length
  const activeHeads = activeSlots
  const potentialCollected =
    summary ? activeHeadCount * summary.contributionAmount : null
  const collectedCaption = potentialCollected !== null
    ? `Potensi ${formatCurrency(potentialCollected)} jika ${activeHeadCount} rumah bayar`
    : null

  const hasActiveDraw = periodResult?.success
    ? (periodResult.data?.draws ?? []).some((d) => !d.voided)
    : false

  const lastWinner = periodResult?.success
    ? (periodResult.data?.draws ?? []).find((d) => !d.voided)?.winnerMember?.name ?? null
    : null

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Arisan</h1>
          <p className="text-muted-foreground">
            Pencatatan iuran dan kocokan arisan bulanan.
          </p>
        </div>
        <PeriodSelector
          periods={periods}
          onPeriodChange={setSelectedPeriodId}
          createPeriodTrigger={<CreateArisanPeriodDialog />}
        />
      </div>

      {selectedPeriodId ? (
        <>
          <SummaryStatCards
            columns={4}
            stats={[
              {
                label: "Terkumpul",
                value: summary ? formatCurrency(summary.collected) : "-",
                caption: collectedCaption,
                icon: Coins,
                iconClassName: "text-green-600",
              },
              {
                label: "Target",
                value: summary ? formatCurrency(summary.target) : "-",
                icon: Target,
                iconClassName: "text-muted-foreground",
              },
              {
                label: "Dana Save",
                value:
                  summary ? formatCurrency(summary.collected - summary.target) : "-",
                icon: PiggyBank,
                iconClassName: "text-blue-600",
                valueClassName: "text-primary",
              },
              {
                label: "Pemenang Terakhir",
                value: lastWinner ?? "-",
                caption: hasActiveDraw ? "Sudah di-kocok" : "Belum di-kocok",
                icon: Trophy,
                iconClassName: "text-amber-600",
              },
            ]}
          />

          {!hasActiveDraw && summary ? (
            <div className="flex items-center gap-2">
              <DrawDialog
                periodId={selectedPeriodId}
                payoutTarget={summary.target}
              />
              <ManualDrawDialog
                periodId={selectedPeriodId}
                activeHeads={activeHeads}
              />
            </div>
          ) : null}

          <ArisanIncomeTable
            periodId={selectedPeriodId}
            period={periodResult}
            members={membersResult}
            arrears={arrears}
          />

          <ArisanDrawHistory draws={draws} loading={drawsLoading} />
        </>
      ) : periods.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Belum ada periode arisan. Buat periode untuk memulai.
          </p>
        </div>
      ) : activeYear !== null && yearSummary ? (
        <>
          <SummaryStatCards
            stats={[
              {
                label: "Total Iuran",
                value: formatCurrency(yearSummary.totalIncome),
                caption: `${yearSummary.incomeCount} iuran`,
                icon: TrendingUp,
                iconClassName: "text-green-600",
              },
              {
                label: "Total Dibayarkan",
                value: formatCurrency(yearSummary.totalPayout),
                caption: `${yearSummary.drawCount} kocokan`,
                icon: TrendingDown,
                iconClassName: "text-red-600",
              },
              {
                label: "Dana Save",
                value:
                  arisanOverview
                    ? formatCurrency(arisanOverview.savings)
                    : "-",
                caption: `Gabungan semua periode ${yearSummary.year}`,
                icon: PiggyBank,
                iconClassName: "text-blue-600",
                valueClassName: "text-primary",
              },
            ]}
          />
          <YearlyIncomeExpenseChart
            year={activeYear}
            data={yearChart}
            title={`Arus arisan tahun ${activeYear}`}
          />
          <PaymentMatrixTable
            matrix={paymentMatrix}
            loading={paymentMatrixResult.isPending}
            year={activeYear}
          />
          <ArisanYearDrawHistory
            draws={yearDraws}
            loading={yearDrawsLoading}
            year={activeYear}
          />
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Pilih periode untuk melihat data arisan
          </p>
        </div>
      )}
    </div>
  )
}
