"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PeriodSelector, type PeriodOption } from "@/components/period-selector";
import {
  SummaryStatCards,
  type SummaryStat,
} from "@/components/summary-stat-cards";
import {
  YearlyIncomeExpenseChart,
  type YearlyFlowPoint,
} from "@/components/yearly-income-expense-chart";
import { CreateSosialPeriodDialog } from "@/features/sosial/components/dialogs/create-sosial-period-dialog";
import { SosialIncomeTable } from "@/features/sosial/components/sosial-income-table";
import {
  sosialPeriodsQuery,
  sosialPeriodQuery,
  sosialSummaryQuery,
  sosialYearSummaryQuery,
  sosialYearChartQuery,
} from "@/features/sosial/queries";
import { membersQuery } from "@features/members/queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

type SummaryLike = {
  success: boolean;
  data?: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    incomeCount: number;
    expenseCount: number;
    minAmount?: number;
  } | null;
  error?: string;
} | null;

function buildSummaryStats(
  summary: SummaryLike,
  balanceCaption?: string
): SummaryStat[] {
  const data = summary?.success ? summary.data ?? null : null;

  if (!data) {
    return [
      { label: "Total Pemasukan", value: "-", caption: "0 iuran", icon: TrendingUp },
      { label: "Total Pengeluaran", value: "-", caption: "0 pengeluaran", icon: TrendingDown },
      { label: "Saldo", value: "-", icon: Wallet },
    ];
  }

  return [
    {
      label: "Total Pemasukan",
      value: formatCurrency(data.totalIncome),
      caption: `${data.incomeCount} iuran`,
      icon: TrendingUp,
    },
    {
      label: "Total Pengeluaran",
      value: formatCurrency(data.totalExpense),
      caption: `${data.expenseCount} pengeluaran`,
      icon: TrendingDown,
    },
    {
      label: "Saldo",
      value: formatCurrency(data.balance),
      caption: balanceCaption ?? null,
      icon: Wallet,
      valueClassName: "text-primary tabular-nums",
    },
  ];
}

export default function SosialPage() {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);

  const periodsQueryState = useQuery(sosialPeriodsQuery);
  const periodsResult = periodsQueryState.data ?? null;
  const periods: PeriodOption[] = periodsResult?.success
    ? periodsResult.data ?? []
    : [];
  const activeYear = periods[0]?.year ?? null;

  const periodQuery = useQuery(sosialPeriodQuery(selectedPeriodId ?? ""));
  const summaryQuery = useQuery(sosialSummaryQuery(selectedPeriodId ?? ""));
  const membersQueryState = useQuery(membersQuery);
  const yearSummaryResult = useQuery(
    sosialYearSummaryQuery(activeYear)
  ).data ?? null;
  const yearChartResult = useQuery(
    sosialYearChartQuery(activeYear)
  ).data ?? null;
  const yearChartPoints: YearlyFlowPoint[] = yearChartResult?.success
    ? yearChartResult.data ?? []
    : [];

  const periodResult = periodQuery.data ?? null;
  const summaryResult = summaryQuery.data ?? null;
  const membersResult = membersQueryState.data ?? null;
  const yearSummary = yearSummaryResult?.success
    ? yearSummaryResult.data ?? null
    : null;
  const loading =
    Boolean(selectedPeriodId) &&
    (periodQuery.isPending || summaryQuery.isPending);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sosial</h1>
          <p className="text-muted-foreground">
            Pencatatan iuran seiklasnya dan pengeluaran sosial bulanan.
          </p>
        </div>
        <PeriodSelector
          periods={periods}
          onPeriodChange={setSelectedPeriodId}
          createPeriodTrigger={<CreateSosialPeriodDialog />}
        />
      </div>

      {selectedPeriodId && !loading && (
        <>
          <SummaryStatCards stats={buildSummaryStats(summaryResult)} />

          <Tabs defaultValue="income" className="space-y-4">
            <TabsList>
              <TabsTrigger value="income">Iuran</TabsTrigger>
              <TabsTrigger value="expense">Pengeluaran</TabsTrigger>
            </TabsList>

            <TabsContent value="income">
              <SosialIncomeTable
                periodId={selectedPeriodId}
                period={periodResult}
                summary={summaryResult}
                members={membersResult}
              />
            </TabsContent>

            <TabsContent value="expense">
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Pengeluaran sosial segera hadir.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {loading && (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
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

      {!selectedPeriodId && !loading && (
        activeYear !== null && yearSummary ? (
          <>
            <SummaryStatCards
              stats={buildSummaryStats(
                {
                  success: true,
                  data: {
                    totalIncome: yearSummary.totalIncome,
                    totalExpense: yearSummary.totalExpense,
                    balance: yearSummary.balance,
                    incomeCount: yearSummary.incomeCount,
                    expenseCount: yearSummary.expenseCount,
                  },
                },
                `Gabungan semua periode ${yearSummary.year}`
              )}
            />
            <YearlyIncomeExpenseChart
              year={activeYear}
              data={yearChartPoints}
              title={`Arus sosial tahun ${activeYear}`}
            />
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Belum ada periode sosial. Buat periode untuk memulai.
            </p>
          </div>
        )
      )}
    </div>
  );
}
