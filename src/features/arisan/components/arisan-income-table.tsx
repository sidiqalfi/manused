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
import { RecordArisanContributionDialog } from "./record-arisan-contribution-dialog"
import { IncomeRecordActions } from "@/components/income-record-actions"
import { deleteArisanIncome } from "../actions/delete-arisan-income"
import { createArisanIncomesBatch } from "../actions/create-arisan-incomes-batch"
import { arisanKeys } from "../queries"
import { formatCurrency, formatDate } from "@/lib/format"
import { activeSlotHeads } from "@/features/members/household"
import type { MemberArrears } from "@/lib/payments/arrears"

type Income = {
  id: string
  memberId: string
  amount: number
  paidAt: Date
  note?: string | null
  member: {
    name: string
    fullName: string
    householdMembers: { name: string }[]
  }
}

interface MembersData {
  id: string
  name: string
  fullName: string
  status: string
  headOfHouseholdId: string | null
}

type Props = {
  periodId: string
  period: { success: boolean; data?: { incomes: Income[]; contributionAmount: number; draws: { voided: boolean }[] }; error?: string } | null
  members: { success: boolean; data?: MembersData[]; error?: string } | null
  /** Tunggakan bulan-bulan sebelumnya per memberId (opsional) */
  arrears?: Map<string, MemberArrears>
}

export function ArisanIncomeTable({ periodId, period, members, arrears }: Props) {
  const [deletingIncome, setDeletingIncome] = useState<Income | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const incomes = period?.success ? period.data?.incomes ?? [] : []
  const contributionAmount = period?.success ? period.data?.contributionAmount ?? 0 : 0
  const hasActiveDraw = period?.success
    ? (period.data?.draws ?? []).some((d) => !d.voided)
    : false

  async function handleDelete(incomeId: string) {
    setDeleting(true)
    setDeleteError(null)

    const result = await deleteArisanIncome(incomeId)

    if (result.error) {
      setDeleteError(result.error)
      setDeleting(false)
      return
    }

    await queryClient.invalidateQueries({ queryKey: arisanKeys.all })
    setDeleting(false)
    setDeletingIncome(null)
  }

  const membersData = members?.success ? members.data ?? [] : []
  const paidMemberIds = new Set(incomes.map((i) => i.memberId))
  // Slot = keluarga: head inactive tetap muncul selama rumahnya
  // masih punya anggota aktif.
  const activeHeads = activeSlotHeads(membersData)
  const unpaidMembers = activeHeads.filter((m) => !paidMemberIds.has(m.id))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold">Iuran Anggota</h3>
        <IncomeRecordActions
          singleTrigger={
            <RecordArisanContributionDialog
              periodId={periodId}
              unpaidMembers={unpaidMembers}
              contributionAmount={contributionAmount}
              arrears={arrears}
            />
          }
          periodId={periodId}
          unpaidMembers={unpaidMembers}
          defaultAmount={contributionAmount}
          minAmount={1}
          dialogTitle="Catat Batch Iuran Arisan"
          submitLabel="Catat Iuran Batch"
          keys={arisanKeys}
          batchAction={createArisanIncomesBatch}
        />
      </div>

      <div className="overflow-x-auto rounded-md border">
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
                  Belum ada iuran tercatat
                </td>
              </tr>
            )}
            {incomes.map((income) => (
              <tr key={income.id} className="border-b">
                <td className="p-3 text-sm">
                  <span className="font-medium">{income.member.name}</span>
                  {income.member.householdMembers.length > 0 && (
                    <span className="block text-xs text-muted-foreground">
                      Rumah:{" "}
                      {income.member.householdMembers
                        .map((m) => m.name)
                        .join(", ")}
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <Badge variant="default">Sudah Bayar</Badge>
                </td>
                <td className="p-3 text-sm">{formatCurrency(income.amount)}</td>
                <td className="p-3 text-sm">{formatDate(income.paidAt)}</td>
                <td className="p-3 text-sm text-muted-foreground">
                  {income.note ?? "-"}
                </td>
                <td className="p-3 text-right">
                  {!hasActiveDraw && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Hapus"
                      onClick={() => setDeletingIncome(income)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
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
            {unpaidMembers.map((m) => {
              const owed = arrears?.get(m.id)
              return (
                <Badge key={m.id} variant="outline" className={owed ? "border-destructive/50 text-destructive" : undefined}>
                  {m.name}
                  {owed && (
                    <span className="ml-1">
                      · nunggak {owed.count} bln ({formatCurrency(owed.amount)})
                    </span>
                  )}
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      <AlertDialog
        open={deletingIncome !== null}
        onOpenChange={(open) => !open && !deleting && setDeletingIncome(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data iuran ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Iuran {deletingIncome?.member.name} sebesar{" "}
              {deletingIncome ? formatCurrency(deletingIncome.amount) : ""}{" "}
              akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError && <p className="text-sm text-destructive" role="alert">{deleteError}</p>}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={() => {
                if (!deletingIncome) return
                void handleDelete(deletingIncome.id)
              }}
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
