"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CashPeriodSelector } from "@/features/cash/components/cash-period-selector";
import { CashSummaryCards } from "@/features/cash/components/cash-summary-cards";
import { CashIncomeTable } from "@/features/cash/components/cash-income-table";
import { CashExpenseTable } from "@/features/cash/components/cash-expense-table";
import { cashPeriodQuery, cashSummaryQuery } from "@/features/cash/queries";
import { membersQuery } from "@features/members/queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CashPage() {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);

  const periodQuery = useQuery(cashPeriodQuery(selectedPeriodId ?? ""));
  const summaryQuery = useQuery(cashSummaryQuery(selectedPeriodId ?? ""));
  const membersQueryState = useQuery(membersQuery);

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
        <div className="text-center py-12">
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      )}

      {!selectedPeriodId && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Pilih periode untuk melihat data kas
          </p>
        </div>
      )}
    </div>
  );
}
