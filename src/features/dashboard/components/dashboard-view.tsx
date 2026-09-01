"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { OverviewCards } from "./overview-cards"
import { BookSectionCard } from "./book-section-card"
import {
  cashPeriodsQuery,
  cashPeriodQuery,
  cashSummaryQuery,
  cashYearSummaryQuery,
  cashYearChartQuery,
} from "@/features/cash/queries"
import {
  sosialPeriodsQuery,
  sosialPeriodQuery,
  sosialSummaryQuery,
  sosialYearSummaryQuery,
  sosialYearChartQuery,
} from "@/features/sosial/queries"
import { membersQuery } from "@/features/members/queries"
import {
  arisanPeriodsQuery,
  arisanPeriodQuery,
  arisanYearChartQuery,
  arisanOverviewQuery,
} from "@/features/arisan/queries"
import { CreateArisanPeriodDialog } from "@/features/arisan/components/create-arisan-period-dialog"
import { RecordArisanContributionDialog } from "@/features/arisan/components/record-arisan-contribution-dialog"
import { DrawDialog } from "@/features/arisan/components/draw-dialog"
import { RecordPaymentDialog } from "@/features/cash/components/dialogs/record-payment-dialog"
import { AddExpenseDialog } from "@/features/cash/components/dialogs/add-expense-dialog"
import { CreatePeriodDialog } from "@/features/cash/components/dialogs/create-period-dialog"
import { RecordSosialContributionDialog } from "@/features/sosial/components/dialogs/record-sosial-contribution-dialog"
import { AddSosialExpenseDialog } from "@/features/sosial/components/dialogs/add-sosial-expense-dialog"
import { CreateSosialPeriodDialog } from "@/features/sosial/components/dialogs/create-sosial-period-dialog"
import { CreateMemberDialog } from "@/features/members/components/create-member-dialog"
import type { YearlyFlowPoint } from "@/components/yearly-income-expense-chart"

type PeriodOption = { id: string; month: number; year: number }

type MemberLike = { id: string; name: string; fullName: string; status: string }

function unpaidOf(
  members: { success: boolean; data?: MemberLike[]; error?: string } | null,
  incomes: { memberId: string }[] | undefined
): MemberLike[] {
  const all = members?.success ? members.data ?? [] : []
  const paid = new Set((incomes ?? []).map((i) => i.memberId))
  return all.filter((m) => m.status === "ACTIVE" && !paid.has(m.id))
}

export function DashboardView({ userName }: { userName: string | null }) {
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

  const cashPeriodResult = useQuery(
    cashPeriodQuery(latestCash?.id ?? "")
  ).data ?? null
  const cashSummaryResult = useQuery(
    cashSummaryQuery(latestCash?.id ?? "")
  ).data ?? null
  const cashChartResult = useQuery(
    cashYearChartQuery(latestCash?.year ?? null)
  ).data ?? null
  const cashYearSummaryResult = useQuery(
    cashYearSummaryQuery(latestCash?.year ?? null)
  ).data ?? null

  const sosialPeriodResult = useQuery(
    sosialPeriodQuery(latestSosial?.id ?? "")
  ).data ?? null
  const sosialSummaryResult = useQuery(
    sosialSummaryQuery(latestSosial?.id ?? "")
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
  const arisanPeriodResult = useQuery(
    arisanPeriodQuery(latestArisan?.id ?? "")
  ).data ?? null

  const cashSummary = cashSummaryResult?.success ? cashSummaryResult.data ?? null : null
  const sosialSummary = sosialSummaryResult?.success ? sosialSummaryResult.data ?? null : null
  const cashYearSummary = cashYearSummaryResult?.success ? cashYearSummaryResult.data ?? null : null
  const sosialYearSummary = sosialYearSummaryResult?.success ? sosialYearSummaryResult.data ?? null : null

  const members = membersResult?.success ? membersResult.data ?? [] : []
  const activeMembers = members.filter((m) => m.status === "ACTIVE").length

  const cashIncomes = cashPeriodResult?.success ? cashPeriodResult.data?.incomes ?? [] : []
  const sosialIncomes = sosialPeriodResult?.success ? sosialPeriodResult.data?.incomes ?? [] : []
  const arisanIncomes = arisanPeriodResult?.success
    ? arisanPeriodResult.data?.incomes ?? []
    : []
  const arisanContribution = arisanPeriodResult?.success
    ? arisanPeriodResult.data?.contributionAmount ?? 0
    : 0
  const arisanPayoutTarget = arisanPeriodResult?.success
    ? arisanPeriodResult.data?.payoutTarget ?? 0
    : 0
  const arisanHasActiveDraw = arisanPeriodResult?.success
    ? (arisanPeriodResult.data?.draws ?? []).some((d) => !d.voided)
    : false

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

  const cashUnpaid = unpaidOf(membersResult, cashIncomes)
  const sosialUnpaid = unpaidOf(membersResult, sosialIncomes)
  const arisanUnpaid = unpaidOf(membersResult, arisanIncomes)

  const cashMin = cashSummary?.minAmount ?? 0
  const cashDues = cashSummary?.duesAmount ?? cashMin
  const sosialMin = sosialSummary?.minAmount ?? 0

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

      <div className="grid gap-4 xl:grid-cols-3">
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
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Kas</p>
            <div className="flex flex-wrap gap-2">
              {latestCash ? (
                <>
                  <RecordPaymentDialog
                    periodId={latestCash.id}
                    unpaidMembers={cashUnpaid}
                    duesAmount={cashDues}
                    minAmount={cashMin}
                    triggerVariant="outline"
                  />
                  <AddExpenseDialog
                    periodId={latestCash.id}
                    triggerVariant="outline"
                  />
                </>
              ) : null}
              <CreatePeriodDialog triggerVariant="outline" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Sosial</p>
            <div className="flex flex-wrap gap-2">
              {latestSosial ? (
                <>
                  <RecordSosialContributionDialog
                    periodId={latestSosial.id}
                    unpaidMembers={sosialUnpaid}
                    minAmount={sosialMin}
                    triggerVariant="outline"
                  />
                  <AddSosialExpenseDialog
                    periodId={latestSosial.id}
                    triggerVariant="outline"
                  />
                </>
              ) : null}
              <CreateSosialPeriodDialog triggerVariant="outline" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Arisan</p>
            <div className="flex flex-wrap gap-2">
              {latestArisan ? (
                <>
                  <RecordArisanContributionDialog
                    periodId={latestArisan.id}
                    unpaidMembers={arisanUnpaid}
                    contributionAmount={arisanContribution}
                    triggerVariant="outline"
                  />
                  {!arisanHasActiveDraw ? (
                    <DrawDialog
                      periodId={latestArisan.id}
                      payoutTarget={arisanPayoutTarget}
                      triggerVariant="outline"
                    />
                  ) : null}
                </>
              ) : null}
              <CreateArisanPeriodDialog triggerVariant="outline" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Anggota</p>
            <div className="flex flex-wrap gap-2">
              <CreateMemberDialog />
            </div>
          </div>
        </CardContent>
      </Card>

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
