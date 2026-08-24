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
import { CashIncomeTable } from "@/features/cash/components/cash-income-table";
import { CashExpenseTable } from "@/features/cash/components/cash-expense-table";
import { CreatePeriodDialog } from "@/features/cash/components/dialogs/create-period-dialog";
import { cashPeriodsQuery, cashPeriodQuery, cashSummaryQuery, cashYearSummaryQuery, cashYearChartQuery } from "@/features/cash/queries";
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
    duesAmount?: number;
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
      { label: "Total Pemasukan", value: "-", caption: "0 pembayaran", icon: TrendingUp },
      { label: "Total Pengeluaran", value: "-", caption: "0 pengeluaran", icon: TrendingDown },
      { label: "Saldo", value: "-", icon: Wallet },
    ];
  }

  return [
    {
      label: "Total Pemasukan",
      value: formatCurrency(data.totalIncome),
      caption: `${data.incomeCount} pembayaran`,
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
      caption:
        balanceCaption ??
        (data.duesAmount != null && data.minAmount != null
          ? `Iuran: ${formatCurrency(data.duesAmount)} (min: ${formatCurrency(data.minAmount)})`
          : null),
      icon: Wallet,
      valueClassName: "text-primary tabular-nums",
    },
  ];
}

export default function CashPage() {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);

  const periodQuery = useQuery(cashPeriodQuery(selectedPeriodId ?? ""));
  const summaryQuery = useQuery(cashSummaryQuery(selectedPeriodId ?? ""));
  const membersQueryState = useQuery(membersQuery);

  const periodsQueryState = useQuery(cashPeriodsQuery);
  const periodsResult = periodsQueryState.data ?? null;
  const periods: PeriodOption[] = periodsResult?.success
    ? periodsResult.data ?? []
    : [];
  const activeYear = periods[0]?.year ?? null;
  const yearSummaryResult = useQuery(
    cashYearSummaryQuery(activeYear)
  ).data ?? null;
  const yearSummary =
    yearSummaryResult?.success ? yearSummaryResult.data ?? null : null;
  const yearChartResult = useQuery(
    cashYearChartQuery(activeYear)
  ).data ?? null;
  const yearChartPoints: YearlyFlowPoint[] = yearChartResult?.success
    ? yearChartResult.data ?? []
    : [];

  const periodResult = periodQuery.data ?? null;
  const summaryResult = summaryQuery.data ?? null;
  const membersResult = membersQueryState.data ?? null;
  const loading =
    Boolean(selectedPeriodId) &&
    (periodQuery.isPending || summaryQuery.isPending);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kas</h1>
          <p className="text-muted-foreground">
            Pencatatan iuran dan pengeluaran kas bulanan.
          </p>
        </div>
        <PeriodSelector
          periods={periods}
          onPeriodChange={setSelectedPeriodId}
          createPeriodTrigger={<CreatePeriodDialog />}
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
              <CashIncomeTable
                periodId={selectedPeriodId}
                period={periodResult}
                summary={summaryResult}
                members={membersResult}
              />
            </TabsContent>

            <TabsContent value="expense">
              <CashExpenseTable
                periodId={selectedPeriodId}
                period={periodResult}
              />
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
            />
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Pilih periode untuk melihat data kas
            </p>
          </div>
        )
      )}
    </div>
  );
}
