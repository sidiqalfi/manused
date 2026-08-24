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
import {
  sosialPeriodsQuery,
  sosialSummaryQuery,
  sosialYearSummaryQuery,
  sosialYearChartQuery,
} from "@/features/sosial/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

type YearSummaryLike = {
  success: boolean;
  data?: {
    year: number;
    totalIncome: number;
    totalExpense: number;
    balance: number;
    incomeCount: number;
    expenseCount: number;
  } | null;
  error?: string;
} | null;

function buildYearStats(
  yearSummary: Exclude<YearSummaryLike, null>["data"]
): SummaryStat[] | null {
  if (!yearSummary) return null;

  return [
    {
      label: "Total Pemasukan",
      value: formatCurrency(yearSummary.totalIncome),
      caption: `${yearSummary.incomeCount} iuran`,
      icon: TrendingUp,
    },
    {
      label: "Total Pengeluaran",
      value: formatCurrency(yearSummary.totalExpense),
      caption: `${yearSummary.expenseCount} pengeluaran`,
      icon: TrendingDown,
    },
    {
      label: "Saldo",
      value: formatCurrency(yearSummary.balance),
      caption: `Gabungan semua periode ${yearSummary.year}`,
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

  const summaryQuery = useQuery(sosialSummaryQuery(selectedPeriodId ?? ""));
  const yearSummaryResult = useQuery(
    sosialYearSummaryQuery(activeYear)
  ).data ?? null;
  const yearChartResult = useQuery(
    sosialYearChartQuery(activeYear)
  ).data ?? null;
  const yearChartPoints: YearlyFlowPoint[] = yearChartResult?.success
    ? yearChartResult.data ?? []
    : [];

  const yearSummary = yearSummaryResult?.success
    ? yearSummaryResult.data ?? null
    : null;
  const loading = Boolean(selectedPeriodId) && summaryQuery.isPending;

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
            <SummaryStatCards stats={buildYearStats(yearSummary)} />
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
