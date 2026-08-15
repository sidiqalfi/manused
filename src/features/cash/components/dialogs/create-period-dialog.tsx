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
import { createCashPeriod } from "../../actions/create-cash-period"

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

type Props = {
  onCreated?: () => void
}

export function CreatePeriodDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const now = new Date()
  const defaultMonth = now.getMonth() + 1
  const defaultYear = now.getFullYear()

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await createCashPeriod(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
      onCreated?.()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="mr-1 h-4 w-4" />
        Periode Baru
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Periode Kas Baru</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Bulan</Label>
              <select
                name="month"
                id="month"
                defaultValue={defaultMonth}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {MONTHS.map((name, i) => (
                  <option key={i} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Tahun</Label>
              <Input
                type="number"
                name="year"
                id="year"
                defaultValue={defaultYear}
                min={2020}
                max={2100}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duesAmount">Nominal Iuran</Label>
              <Input
                type="number"
                name="duesAmount"
                id="duesAmount"
                placeholder="5000"
                min={1}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minAmount">Batas Bawah</Label>
              <Input
                type="number"
                name="minAmount"
                id="minAmount"
                placeholder="3000"
                min={1}
                required
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full">Buat Periode</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
