"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CashPeriodSelector } from "@/features/cash/components/cash-period-selector";
import { CashSummaryCards } from "@/features/cash/components/cash-summary-cards";
import { CashIncomeTable } from "@/features/cash/components/cash-income-table";
import { CashExpenseTable } from "@/features/cash/components/cash-expense-table";
import { CashYearChart } from "@/features/cash/components/cash-year-chart";
import { cashPeriodsQuery, cashPeriodQuery, cashSummaryQuery, cashYearSummaryQuery, cashYearChartQuery } from "@/features/cash/queries";
import { membersQuery } from "@features/members/queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function CashPage() {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);

  const periodQuery = useQuery(cashPeriodQuery(selectedPeriodId ?? ""));
  const summaryQuery = useQuery(cashSummaryQuery(selectedPeriodId ?? ""));
  const membersQueryState = useQuery(membersQuery);

  const periodsQueryState = useQuery(cashPeriodsQuery);
  const periodsResult = periodsQueryState.data ?? null;
  const periods = periodsResult?.success ? periodsResult.data ?? [] : [];
  const activeYear = periods[0]?.year ?? null;
  const yearSummaryResult = useQuery(
    cashYearSummaryQuery(activeYear)
  ).data ?? null;
  const yearSummary =
    yearSummaryResult?.success ? yearSummaryResult.data ?? null : null;
  const yearChartResult = useQuery(
    cashYearChartQuery(activeYear)
  ).data ?? null;

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
        <CashPeriodSelector
          onPeriodChange={setSelectedPeriodId}
        />
      </div>

      {selectedPeriodId && !loading && (
        <>
          <CashSummaryCards summary={summaryResult} />

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
            <CashSummaryCards
              summary={{
                success: true,
                data: {
                  totalIncome: yearSummary.totalIncome,
                  totalExpense: yearSummary.totalExpense,
                  balance: yearSummary.balance,
                  incomeCount: yearSummary.incomeCount,
                  expenseCount: yearSummary.expenseCount,
                },
              }}
              balanceCaption={`Gabungan semua periode ${yearSummary.year}`}
            />
            <CashYearChart year={activeYear} data={yearChartResult} />
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
