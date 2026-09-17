"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { OverviewCards } from "./overview-cards"
import { BookSectionCard } from "./book-section-card"
import { dashboardDataQuery } from "../queries"
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
import { IncomeRecordActions } from "@/components/income-record-actions"
import { createCashIncomesBatch } from "@/features/cash/actions/create-cash-incomes-batch"
import { createSosialIncomesBatch } from "@/features/sosial/actions/create-sosial-incomes-batch"
import { createArisanIncomesBatch } from "@/features/arisan/actions/create-arisan-incomes-batch"
import { cashKeys } from "@/features/cash/queries"
import { sosialKeys } from "@/features/sosial/queries"
import { arisanKeys } from "@/features/arisan/queries"
import { SOSIAL_MIN_CONTRIBUTION } from "@/features/sosial/sosial-schemas"
import type { YearlyFlowPoint } from "@/components/yearly-income-expense-chart"
import type { DashboardMember, DashboardIncomeRow } from "../actions/get-dashboard-data"

type PeriodOption = { id: string; month: number; year: number }

function unpaidOf(
  members: DashboardMember[],
  incomes: DashboardIncomeRow[],
  options: { headsOnly?: boolean } = {}
): DashboardMember[] {
  const paid = new Set(incomes.map((i) => i.memberId))
  return members.filter(
    (m) =>
      m.status === "ACTIVE" &&
      (!options.headsOnly || m.headOfHouseholdId == null) &&
      !paid.has(m.id)
  )
}

export function DashboardView({ userName }: { userName: string | null }) {
  const { data: result, isPending } = useQuery(dashboardDataQuery)

  const data = result?.success ? result.data ?? null : null

  const cashPeriods: PeriodOption[] = data?.periods.cash ?? []
  const sosialPeriods: PeriodOption[] = data?.periods.sosial ?? []
  const arisanPeriods: PeriodOption[] = data?.periods.arisan ?? []
  const members: DashboardMember[] = data?.members ?? []

  const latestCash = cashPeriods[0] ?? null
  const latestSosial = sosialPeriods[0] ?? null
  const latestArisan = arisanPeriods[0] ?? null

  const cashSummary = data?.summaries.cash ?? null
  const sosialSummary = data?.summaries.sosial ?? null
  const cashYearSummary = data?.yearSummaries.cash ?? null
  const sosialYearSummary = data?.yearSummaries.sosial ?? null
  const arisanOverview = data?.arisanOverview ?? null

  const activeMembers = members.filter((m) => m.status === "ACTIVE").length

  const cashIncomes = data?.latest.cash?.incomes ?? []
  const sosialIncomes = data?.latest.sosial?.incomes ?? []
  const arisanIncomes = data?.latest.arisan?.incomes ?? []

  const arisanHasActiveDraw = data?.latest.arisan?.hasActiveDraw ?? false

  const cashChart: YearlyFlowPoint[] = data?.yearCharts.cash ?? []
  const sosialChart: YearlyFlowPoint[] = data?.yearCharts.sosial ?? []
  const arisanChart: YearlyFlowPoint[] = data?.yearCharts.arisan ?? []

  const cashYearCaption = cashYearSummary ? `Total tahun ${cashYearSummary.year}` : null
  const sosialYearCaption = sosialYearSummary ? `Total tahun ${sosialYearSummary.year}` : null

  const arisanCaption = arisanOverview
    ? arisanOverview.lastWinnerName
      ? `Pemenang: ${arisanOverview.lastWinnerName}`
      : "Belum ada pemenang"
    : null

  const cashUnpaid = unpaidOf(members, cashIncomes)
  const sosialUnpaid = unpaidOf(members, sosialIncomes)
  const arisanUnpaid = unpaidOf(members, arisanIncomes, { headsOnly: true })

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
        activeMembers={result?.success ? activeMembers : null}
        totalMembers={result?.success ? members.length : null}
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
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Kas</p>
            <div className="flex flex-wrap gap-2">
              {latestCash ? (
                <>
                  <IncomeRecordActions
                    singleTrigger={
                      <RecordPaymentDialog
                        periodId={latestCash.id}
                        unpaidMembers={cashUnpaid}
                        duesAmount={cashDues}
                        minAmount={cashMin}
                        triggerVariant="outline"
                      />
                    }
                    periodId={latestCash.id}
                    unpaidMembers={cashUnpaid}
                    defaultAmount={cashDues}
                    minAmount={cashMin}
                    dialogTitle="Catat Batch Pembayaran Iuran"
                    submitLabel="Catat Pembayaran Batch"
                    keys={cashKeys}
                    batchAction={createCashIncomesBatch}
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
                  <IncomeRecordActions
                    singleTrigger={
                      <RecordSosialContributionDialog
                        periodId={latestSosial.id}
                        unpaidMembers={sosialUnpaid}
                        minAmount={sosialMin}
                        triggerVariant="outline"
                      />
                    }
                    periodId={latestSosial.id}
                    unpaidMembers={sosialUnpaid}
                    defaultAmount={sosialMin}
                    minAmount={SOSIAL_MIN_CONTRIBUTION}
                    labelMinAmount={sosialMin}
                    dialogTitle="Catat Batch Iuran Sosial"
                    submitLabel="Catat Iuran Batch"
                    keys={sosialKeys}
                    batchAction={createSosialIncomesBatch}
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
                  <IncomeRecordActions
                    singleTrigger={
                      <RecordArisanContributionDialog
                        periodId={latestArisan.id}
                        unpaidMembers={arisanUnpaid}
                        contributionAmount={data?.latest.arisan?.period.contributionAmount ?? 0}
                        triggerVariant="outline"
                      />
                    }
                    periodId={latestArisan.id}
                    unpaidMembers={arisanUnpaid}
                    defaultAmount={data?.latest.arisan?.period.contributionAmount ?? 0}
                    minAmount={1}
                    dialogTitle="Catat Batch Iuran Arisan"
                    submitLabel="Catat Iuran Batch"
                    keys={arisanKeys}
                    batchAction={createArisanIncomesBatch}
                    triggerVariant="outline"
                  />
                  {!arisanHasActiveDraw ? (
                    <DrawDialog
                      periodId={latestArisan.id}
                      payoutTarget={data?.latest.arisan?.period.payoutTarget ?? 0}
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
              <CreateMemberDialog members={members} />
            </div>
          </div>
        </CardContent>
      </Card>

      {isPending && (
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
