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
import { Trash2 } from "lucide-react"
import { AddExpenseDialog } from "./dialogs/add-expense-dialog"
import { deleteCashExpense } from "../actions/delete-cash-expense"
import { getCashPeriod } from "../actions/get-cash-periods"

type Expense = {
  id: string
  description: string
  amount: number
  spentAt: Date
}

type Props = {
  periodId: string
  period: { success: boolean; data?: { expenses: Expense[] }; error?: string } | null
}

function formatCurrency(amount: number) {
  return `Rp ${amount.toLocaleString("id-ID")}`
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function CashExpenseTable({ periodId, period }: Props) {
  const [error, setError] = useState<string | null>(null)
  const data = period?.success ? period.data : null
  const [expenses, setExpenses] = useState<Expense[]>(data?.expenses ?? [])
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)

  const refreshData = async () => {
    const updatedPeriod = await getCashPeriod(periodId)
    const refreshedData = updatedPeriod?.success ? updatedPeriod.data : null
    setExpenses(refreshedData?.expenses ?? [])
  }

  async function handleDelete(expenseId: string) {
    const result = await deleteCashExpense(expenseId)
    if (result.error) {
      setError(result.error)
    } else {
      setError(null) // Clear any previous errors on success
      await refreshData()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pengeluaran</h3>
        <AddExpenseDialog periodId={periodId} onCreated={refreshData} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="rounded-md border">
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
                <td className="p-3 text-sm">{expense.description}</td>
                <td className="p-3 text-sm">{formatCurrency(expense.amount)}</td>
                <td className="p-3 text-sm">{formatDate(expense.spentAt)}</td>
                <td className="p-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Hapus"
                    onClick={() => setDeletingExpense(expense)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
