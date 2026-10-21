"use client"

import { useState } from "react"
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
import { Trash2, Link2, X } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useQueryClient } from "@tanstack/react-query"
import { linkCashExpenseToKegiatan } from "@features/kegiatan/actions/link-cash-expense"
import { unlinkCashExpenseFromKegiatan } from "@features/kegiatan/actions/unlink-cash-expense"
import { kegiatanListQuery, kegiatanKeys } from "@features/kegiatan/queries"
import { useQuery } from "@tanstack/react-query"
import { AddExpenseDialog } from "./dialogs/add-expense-dialog"
import { deleteCashExpense } from "../actions/delete-cash-expense"
import { cashKeys } from "../queries"
import { formatCurrency, formatDate } from "@/lib/format"

type Expense = {
  id: string
  description: string
  amount: number
  spentAt: Date
  relatedEvent?: { id: string; slug: string; name: string } | null
}

type Props = {
  periodId: string
  period: { success: boolean; data?: { expenses: Expense[] }; error?: string } | null
}

export function CashExpenseTable({ periodId, period }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)
  const [linkingExpense, setLinkingExpense] = useState<Expense | null>(null)
  const [linkKegiatanId, setLinkKegiatanId] = useState("")
  const queryClient = useQueryClient()

  const kegiatanResult = useQuery(kegiatanListQuery)
  const kegiatanList = kegiatanResult.data?.success
    ? kegiatanResult.data.data ?? []
    : []

  const expenses = period?.success ? period.data?.expenses ?? [] : []

  async function handleDelete(expenseId: string) {
    const result = await deleteCashExpense(expenseId)
    if (result.error) {
      setError(result.error)
    } else {
      setError(null) // Clear any previous errors on success
      await queryClient.invalidateQueries({ queryKey: cashKeys.all })
      await queryClient.invalidateQueries({ queryKey: kegiatanKeys.all })
    }
  }

  async function handleLink() {
    if (!linkingExpense || !linkKegiatanId) return
    const fd = new FormData()
    fd.set("expenseId", linkingExpense.id)
    fd.set("kegiatanId", linkKegiatanId)
    const result = await linkCashExpenseToKegiatan(fd)
    if (result.error) {
      setError(result.error)
    } else {
      setError(null)
      await queryClient.invalidateQueries({ queryKey: cashKeys.all })
      await queryClient.invalidateQueries({ queryKey: kegiatanKeys.all })
    }
    setLinkingExpense(null)
    setLinkKegiatanId("")
  }

  async function handleUnlink(expenseId: string) {
    const fd = new FormData()
    fd.set("expenseId", expenseId)
    const result = await unlinkCashExpenseFromKegiatan(fd)
    if (result.error) {
      setError(result.error)
    } else {
      setError(null)
      await queryClient.invalidateQueries({ queryKey: cashKeys.all })
      await queryClient.invalidateQueries({ queryKey: kegiatanKeys.all })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold">Pengeluaran</h3>
        <AddExpenseDialog periodId={periodId} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left text-sm font-medium">Deskripsi</th>
              <th className="p-3 text-left text-sm font-medium">Nominal</th>
              <th className="p-3 text-left text-sm font-medium">Tanggal</th>
              <th className="p-3 text-right text-sm font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-sm text-muted-foreground">
                  Belum ada pengeluaran tercatat
                </td>
              </tr>
            )}
            {expenses.map((expense) => (
              <tr key={expense.id} className="border-b">
                <td className="p-3 text-sm">
                  {expense.description}
                  {expense.relatedEvent && (
                    <span className="mt-0.5 flex items-center gap-1">
                      <Link
                        href={`/dashboard/kegiatan/${expense.relatedEvent.slug}`}
                      >
                        <Badge variant="secondary" className="hover:bg-secondary/80">
                          📅 {expense.relatedEvent.name}
                        </Badge>
                      </Link>
                      <button
                        type="button"
                        aria-label="Lepas tautan kegiatan"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleUnlink(expense.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  )}
                </td>
                <td className="p-3 text-sm">{formatCurrency(expense.amount)}</td>
                <td className="p-3 text-sm">{formatDate(expense.spentAt)}</td>
                <td className="p-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    {!expense.relatedEvent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Tautkan ke kegiatan"
                        onClick={() => {
                          setLinkingExpense(expense)
                          setLinkKegiatanId("")
                        }}
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Hapus"
                      onClick={() => setDeletingExpense(expense)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={linkingExpense !== null}
        onOpenChange={(open) => {
          if (!open) {
            setLinkingExpense(null)
            setLinkKegiatanId("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tautkan ke Kegiatan</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Pengeluaran &quot;{linkingExpense?.description}&quot; (
            {linkingExpense ? formatCurrency(linkingExpense.amount) : ""}) akan
            tercatat sebagai subsidi kegiatan.
          </p>
          <select
            value={linkKegiatanId}
            onChange={(e) => setLinkKegiatanId(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Pilih kegiatan"
          >
            <option value="">Pilih kegiatan</option>
            {kegiatanList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name} ({formatDate(k.eventDate)})
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setLinkingExpense(null)
                setLinkKegiatanId("")
              }}
            >
              Batal
            </Button>
            <Button onClick={handleLink} disabled={!linkKegiatanId}>
              Tautkan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deletingExpense !== null}
        onOpenChange={(open) => !open && setDeletingExpense(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pengeluaran ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Pengeluaran {deletingExpense?.description} sebesar{" "}
              {deletingExpense ? formatCurrency(deletingExpense.amount) : ""}{" "}
              akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!deletingExpense) return
                setDeletingExpense(null)
                await handleDelete(deletingExpense.id)
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
