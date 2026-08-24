"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { RecordPaymentDialog } from "./dialogs/record-payment-dialog"
import { deleteCashIncome } from "../actions/delete-cash-income"
import { cashKeys } from "../queries"
import { formatCurrency, formatDate } from "@/lib/format"

type Income = {
  id: string
  memberId: string
  amount: number
  paidAt: Date
  note?: string | null
  member: {
    name: string
    fullName: string
  }
}

interface MembersData {
  id: string
  name: string
  fullName: string
  status: string
}

type Props = {
  periodId: string
  period: { success: boolean; data?: { incomes: Income[] }; error?: string } | null
  summary: { success: boolean; data?: { duesAmount: number; minAmount: number }; error?: string } | null
  members: { success: boolean; data?: MembersData[]; error?: string } | null
}

export function CashIncomeTable({ periodId, period, summary, members }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [deletingIncome, setDeletingIncome] = useState<Income | null>(null)
  const queryClient = useQueryClient()

  const incomes = period?.success ? period.data?.incomes ?? [] : []

  async function handleDelete(incomeId: string) {
    const result = await deleteCashIncome(incomeId)
    if (result.error) {
      setError(result.error)
    } else {
      setError(null)
      await queryClient.invalidateQueries({ queryKey: cashKeys.all })
    }
  }

  const membersData = members?.success ? members.data ?? [] : []
  const paidMemberIds = new Set(incomes.map((i) => i.memberId))
  const activeMembers = membersData.filter((m) => m.status === "ACTIVE")
  const unpaidMembers = activeMembers.filter((m) => !paidMemberIds.has(m.id))

  const duesAmount = summary?.success ? summary.data?.duesAmount ?? 0 : 0
  const minAmount = summary?.success ? summary.data?.minAmount ?? 0 : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Iuran Anggota</h3>
        <RecordPaymentDialog
          periodId={periodId}
          unpaidMembers={unpaidMembers}
          duesAmount={duesAmount}
          minAmount={minAmount}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left text-sm font-medium">Nama</th>
              <th className="p-3 text-left text-sm font-medium">Status</th>
              <th className="p-3 text-left text-sm font-medium">Nominal</th>
              <th className="p-3 text-left text-sm font-medium">Tanggal</th>
              <th className="p-3 text-left text-sm font-medium">Catatan</th>
              <th className="p-3 text-right text-sm font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {incomes.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-sm text-muted-foreground">
                  Belum ada pembayaran tercatat
                </td>
              </tr>
            )}
            {incomes.map((income) => (
              <tr key={income.id} className="border-b">
                <td className="p-3 text-sm">{income.member.name}</td>
                <td className="p-3">
                  <Badge variant="default">Sudah Bayar</Badge>
                </td>
                <td className="p-3 text-sm">{formatCurrency(income.amount)}</td>
                <td className="p-3 text-sm">{formatDate(income.paidAt)}</td>
                <td className="p-3 text-sm text-muted-foreground">
                  {income.note ?? "-"}
                </td>
                <td className="p-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Hapus"
                    onClick={() => setDeletingIncome(income)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {unpaidMembers.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-muted-foreground">
            Belum bayar ({unpaidMembers.length} anggota):
          </p>
          <div className="flex flex-wrap gap-2">
            {unpaidMembers.map((m) => (
              <Badge key={m.id} variant="outline">
                {m.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <AlertDialog
        open={deletingIncome !== null}
        onOpenChange={(open) => !open && setDeletingIncome(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data pembayaran ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Pembayaran iuran {deletingIncome?.member.name} sebesar{" "}
              {deletingIncome ? formatCurrency(deletingIncome.amount) : ""}{" "}
              akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!deletingIncome) return
                setDeletingIncome(null)
                await handleDelete(deletingIncome.id)
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
