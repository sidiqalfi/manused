"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { OverviewCards } from "./overview-cards"
import { BookSectionCard } from "./book-section-card"
import {
  cashPeriodsQuery,
  cashYearSummaryQuery,
  cashYearChartQuery,
} from "@/features/cash/queries"
import {
  sosialPeriodsQuery,
  sosialYearSummaryQuery,
  sosialYearChartQuery,
} from "@/features/sosial/queries"
import { membersQuery } from "@/features/members/queries"
import { KegiatanCalendar } from "@/features/kegiatan/components/kegiatan-calendar"
import {
  arisanPeriodsQuery,
  arisanYearChartQuery,
  arisanOverviewQuery,
} from "@/features/arisan/queries"
import { CreateArisanPeriodDialog } from "@/features/arisan/components/create-arisan-period-dialog"
import { CreatePeriodDialog } from "@/features/cash/components/dialogs/create-period-dialog"
import { CreateSosialPeriodDialog } from "@/features/sosial/components/dialogs/create-sosial-period-dialog"
import type { YearlyFlowPoint } from "@/components/yearly-income-expense-chart"

type PeriodOption = { id: string; month: number; year: number }

export function DashboardView({
  userName,
}: {
  userName: string | null
}) {
  const cashPeriodsResult = useQuery(cashPeriodsQuery).data ?? null
  const sosialPeriodsResult = useQuery(sosialPeriodsQuery).data ?? null
  const membersResult = useQuery(membersQuery).data ?? null
  const membersLoading = useQuery(membersQuery).isPending
  const arisanOverviewResult = useQuery(arisanOverviewQuery).data ?? null
  const arisanPeriodsResult = useQuery(arisanPeriodsQuery).data ?? null

  const cashPeriods: PeriodOption[] = cashPeriodsResult?.success
    ? cashPeriodsResult.data ?? []
    : []
  const sosialPeriods: PeriodOption[] = sosialPeriodsResult?.success
    ? sosialPeriodsResult.data ?? []
    : []
  const arisanPeriods: PeriodOption[] = arisanPeriodsResult?.success
    ? arisanPeriodsResult.data ?? []
    : []

  const latestCash = cashPeriods[0] ?? null
  const latestSosial = sosialPeriods[0] ?? null
  const latestArisan = arisanPeriods[0] ?? null

  const cashChartResult = useQuery(
    cashYearChartQuery(latestCash?.year ?? null)
  ).data ?? null
  const cashYearSummaryResult = useQuery(
    cashYearSummaryQuery(latestCash?.year ?? null)
  ).data ?? null

  const sosialChartResult = useQuery(
    sosialYearChartQuery(latestSosial?.year ?? null)
  ).data ?? null
  const sosialYearSummaryResult = useQuery(
    sosialYearSummaryQuery(latestSosial?.year ?? null)
  ).data ?? null
  const arisanChartResult = useQuery(
    arisanYearChartQuery(latestArisan?.year ?? null)
  ).data ?? null

  const cashYearSummary = cashYearSummaryResult?.success ? cashYearSummaryResult.data ?? null : null
  const sosialYearSummary = sosialYearSummaryResult?.success ? sosialYearSummaryResult.data ?? null : null

  const members = membersResult?.success ? membersResult.data ?? [] : []
  const activeMembers = members.filter((m) => m.status === "ACTIVE").length

  const cashChart: YearlyFlowPoint[] = cashChartResult?.success
    ? cashChartResult.data ?? []
    : []
  const sosialChart: YearlyFlowPoint[] = sosialChartResult?.success
    ? sosialChartResult.data ?? []
    : []
  const arisanChart: YearlyFlowPoint[] = arisanChartResult?.success
    ? arisanChartResult.data ?? []
    : []

  const cashYearCaption = cashYearSummary ? `Total tahun ${cashYearSummary.year}` : null
  const sosialYearCaption = sosialYearSummary ? `Total tahun ${sosialYearSummary.year}` : null

  const arisanOverview = arisanOverviewResult?.success
    ? arisanOverviewResult.data ?? null
    : null
  const arisanCaption = arisanOverview
    ? arisanOverview.lastWinnerName
      ? `Pemenang: ${arisanOverview.lastWinnerName}`
      : "Belum ada pemenang"
    : null



  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {userName ? `Selamat datang, ${userName}` : "Dashboard"}
        </h1>
        <p className="text-muted-foreground">
          Ringkasan kas, sosial, dan anggota organisasi.
        </p>
      </div>

      <OverviewCards
        cashBalance={cashYearSummary?.balance ?? null}
        cashCaption={cashYearCaption}
        sosialBalance={sosialYearSummary?.balance ?? null}
        sosialCaption={sosialYearCaption}
        arisanSavings={arisanOverview?.savings ?? null}
        arisanCaption={arisanCaption}
        activeMembers={membersResult?.success ? activeMembers : null}
        totalMembers={membersResult?.success ? members.length : null}
      />

      {/* min-w-0: tanpa ini, kartu grafik memaksa grid melebar melebihi
          viewport di layar sempit begitu data chart termuat. */}
      <div className="grid min-w-0 gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="min-w-0 space-y-4">
          <BookSectionCard
            title="Kas"
            href="/dashboard/cash"
            periodLabel={latestCash ? `Tahun ${latestCash.year}` : null}
            chart={
              latestCash
                ? {
                    year: latestCash.year,
                    data: cashChart,
                    title: `Arus kas tahun ${latestCash.year}`,
                  }
                : null
            }
            emptyText="Belum ada periode kas. Buat periode untuk memulai."
            createPeriodTrigger={<CreatePeriodDialog triggerVariant="outline" />}
            initialBalance={cashYearSummary?.initialBalance ?? null}
          />
          <BookSectionCard
            title="Sosial"
            href="/dashboard/sosial"
            periodLabel={latestSosial ? `Tahun ${latestSosial.year}` : null}
            chart={
              latestSosial
                ? {
                    year: latestSosial.year,
                    data: sosialChart,
                    title: `Arus sosial tahun ${latestSosial.year}`,
                  }
                : null
            }
            emptyText="Belum ada periode sosial. Buat periode untuk memulai."
            createPeriodTrigger={
              <CreateSosialPeriodDialog triggerVariant="outline" />
            }
            initialBalance={sosialYearSummary?.initialBalance ?? null}
          />
          <BookSectionCard
            title="Arisan"
            href="/dashboard/arisan"
            periodLabel={latestArisan ? `Tahun ${latestArisan.year}` : null}
            chart={
              latestArisan
                ? {
                    year: latestArisan.year,
                    data: arisanChart,
                    title: `Arus arisan tahun ${latestArisan.year}`,
                  }
                : null
            }
            emptyText="Belum ada periode arisan. Buat periode untuk memulai."
            createPeriodTrigger={
              <CreateArisanPeriodDialog triggerVariant="outline" />
            }
            initialBalance={arisanOverview?.initialSave ?? null}
            initialBalanceLabel="Saldo awal dana save"
          />
        </div>
        <Card>
          <CardContent className="p-4">
            <KegiatanCalendar />
          </CardContent>
        </Card>
      </div>

      {membersLoading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10"
            >
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-3 h-8 w-36" />
              <Skeleton className="mt-2 h-3 w-20" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
