"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { AddSosialExpenseDialog } from "./dialogs/add-sosial-expense-dialog"
import { deleteSosialExpense } from "../actions/delete-sosial-expense"
import { sosialKeys } from "../queries"
import { formatCurrency, formatDate } from "@/lib/format"

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

export function SosialExpenseTable({ periodId, period }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)
  const queryClient = useQueryClient()

  const expenses = period?.success ? period.data?.expenses ?? [] : []

  async function handleDelete(expenseId: string) {
    const result = await deleteSosialExpense(expenseId)
    if (result.error) {
      setError(result.error)
    } else {
      setError(null)
      await queryClient.invalidateQueries({ queryKey: sosialKeys.all })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold">Pengeluaran</h3>
        <AddSosialExpenseDialog periodId={periodId} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Deskripsi</TableHead>
              <TableHead>Nominal</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="p-4 text-center text-muted-foreground">
                  Belum ada pengeluaran tercatat
                </TableCell>
              </TableRow>
            )}
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="text-sm">{expense.description}</TableCell>
                <TableCell className="text-sm">{formatCurrency(expense.amount)}</TableCell>
                <TableCell className="text-sm">{formatDate(expense.spentAt)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Hapus"
                    onClick={() => setDeletingExpense(expense)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
