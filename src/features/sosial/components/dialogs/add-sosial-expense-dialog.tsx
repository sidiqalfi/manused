"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { createSosialExpense } from "../../actions/create-sosial-expense"
import { sosialKeys } from "../../queries"

type Props = {
  periodId: string
}

export function AddSosialExpenseDialog({ periodId }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const today = new Date().toISOString().split("T")[0]

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await createSosialExpense(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
      await queryClient.invalidateQueries({ queryKey: sosialKeys.all })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus data-icon="inline-start" />
            Tambah Pengeluaran
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Pengeluaran Sosial</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="periodId" value={periodId} />

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Input
              type="text"
              name="description"
              id="description"
              placeholder="Beli konsumsi rapat, Sewa sound system, dll"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Nominal</Label>
            <Input
              type="number"
              name="amount"
              id="amount"
              placeholder="50000"
              min={1}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="spentAt">Tanggal</Label>
            <Input
              type="date"
              name="spentAt"
              id="spentAt"
              defaultValue={today}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full">Tambah Pengeluaran</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
