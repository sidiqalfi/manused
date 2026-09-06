"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PeriodSelector, type PeriodOption } from "@/components/period-selector"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  YearlyIncomeExpenseChart,
  type YearlyFlowPoint,
} from "@/components/yearly-income-expense-chart"
import { CreateArisanPeriodDialog } from "@/features/arisan/components/create-arisan-period-dialog"
import { ArisanIncomeTable } from "@/features/arisan/components/arisan-income-table"
import { ArisanDrawHistory } from "@/features/arisan/components/arisan-draw-history"
import { ArisanYearDrawHistory } from "@/features/arisan/components/arisan-year-draw-history"
import { DrawDialog } from "@/features/arisan/components/draw-dialog"
import {
  arisanPeriodsQuery,
  arisanPeriodQuery,
  arisanSummaryQuery,
  arisanDrawsQuery,
  arisanYearSummaryQuery,
  arisanYearChartQuery,
  arisanYearDrawsQuery,
  arisanOverviewQuery,
} from "@/features/arisan/queries"
import { membersQuery } from "@/features/members/queries"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Coins, Target, PiggyBank, Trophy, TrendingUp, TrendingDown, type LucideIcon } from "lucide-react"

function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  valueClassName,
}: {
  label: string
  value: string
  caption?: string | null
  icon: LucideIcon
  valueClassName?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold tabular-nums", valueClassName)}>
          {value}
        </div>
        {caption ? (
          <p className="text-xs text-muted-foreground">{caption}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

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

  const arisanOverviewResult = useQuery(arisanOverviewQuery).data ?? null
  const arisanOverview = arisanOverviewResult?.success
    ? arisanOverviewResult.data ?? null
    : null

  const summary = summaryResult?.success ? summaryResult.data ?? null : null
  const draws = drawsResult?.success ? drawsResult.data ?? [] : null

  const membersData = membersResult?.success ? membersResult.data ?? [] : []
  const activeHeadCount = membersData.filter(
    (m) => m.status === "ACTIVE" && m.headOfHouseholdId == null
  ).length
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
      <div className="flex items-center justify-between">
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Terkumpul"
              value={summary ? formatCurrency(summary.collected) : "-"}
              caption={collectedCaption}
              icon={Coins}
            />
            <StatCard
              label="Target"
              value={summary ? formatCurrency(summary.target) : "-"}
              icon={Target}
            />
            <StatCard
              label="Dana Save"
              value={
                summary ? formatCurrency(summary.collected - summary.target) : "-"
              }
              icon={PiggyBank}
              valueClassName="text-primary"
            />
            <StatCard
              label="Pemenang Terakhir"
              value={lastWinner ?? "-"}
              caption={hasActiveDraw ? "Sudah di-kocok" : "Belum di-kocok"}
              icon={Trophy}
            />
          </div>

          {!hasActiveDraw && summary ? (
            <DrawDialog
              periodId={selectedPeriodId}
              payoutTarget={summary.target}
            />
          ) : null}

          <ArisanIncomeTable
            periodId={selectedPeriodId}
            period={periodResult}
            members={membersResult}
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
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              label="Total Iuran"
              value={formatCurrency(yearSummary.totalIncome)}
              caption={`${yearSummary.incomeCount} iuran`}
              icon={TrendingUp}
            />
            <StatCard
              label="Total Dibayarkan"
              value={formatCurrency(yearSummary.totalPayout)}
              caption={`${yearSummary.drawCount} kocokan`}
              icon={TrendingDown}
            />
            <StatCard
              label="Dana Save"
              value={
                arisanOverview
                  ? formatCurrency(arisanOverview.savings)
                  : "-"
              }
              caption={`Gabungan semua periode ${yearSummary.year}`}
              icon={PiggyBank}
              valueClassName="text-primary"
            />
          </div>
          <YearlyIncomeExpenseChart
            year={activeYear}
            data={yearChart}
            title={`Arus arisan tahun ${activeYear}`}
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
