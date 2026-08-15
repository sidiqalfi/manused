"use client";

import { useState, useEffect } from "react";
import { CashPeriodSelector } from "@/features/cash/components/cash-period-selector";
import { CashSummaryCards } from "@/features/cash/components/cash-summary-cards";
import { CashIncomeTable } from "@/features/cash/components/cash-income-table";
import { CashExpenseTable } from "@/features/cash/components/cash-expense-table";
import { getCashPeriod, GetCashPeriodResult } from "@/features/cash/actions/get-cash-periods";
import { getCashSummary, GetCashSummaryResult } from "@/features/cash/actions/get-cash-summary";
import { getMembers, GetMembersResult } from "@features/members/actions/get-members";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CashPage() {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [periodResult, setPeriodResult] = useState<GetCashPeriodResult | null>(null);
  const [summaryResult, setSummaryResult] = useState<GetCashSummaryResult | null>(null);
  const [membersResult, setMembersResult] = useState<GetMembersResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Load period details when selected
  useEffect(() => {
    if (!selectedPeriodId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const periodResult = await getCashPeriod(selectedPeriodId);
        const summaryResult = await getCashSummary(selectedPeriodId);
        const membersResult = await getMembers();

        // Handle errors individually instead of masking them
        if (!periodResult?.success && periodResult?.error) {
          console.error("Failed to load period:", periodResult.error);
        }
        if (!summaryResult?.success && summaryResult?.error) {
          console.error("Failed to load summary:", summaryResult.error);
        }
        if (!membersResult?.success && membersResult?.error) {
          console.error("Failed to load members:", membersResult.error);
        }

        setPeriodResult(periodResult);
        setSummaryResult(summaryResult);
        setMembersResult(membersResult);
      } catch (error) {
        console.error("Failed to load period data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedPeriodId]);

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
