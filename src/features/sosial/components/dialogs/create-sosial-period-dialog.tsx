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
import { createSosialPeriod } from "../../actions/create-sosial-period"
import { sosialKeys } from "../../queries"
import { MONTHS } from "@/lib/months"

export function CreateSosialPeriodDialog({
  triggerVariant = "default",
}: {
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const now = new Date()
  const defaultMonth = now.getMonth() + 1
  const defaultYear = now.getFullYear()

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await createSosialPeriod(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
      await queryClient.invalidateQueries({ queryKey: sosialKeys.periods() })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant={triggerVariant} />}>
        <Plus className="mr-1 h-4 w-4" />
        Periode Baru
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Periode Sosial Baru</DialogTitle>
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
          <div className="space-y-2">
            <Label htmlFor="minAmount">Minimal Iuran</Label>
            <Input
              type="number"
              name="minAmount"
              id="minAmount"
              placeholder="2000"
              defaultValue={2000}
              min={1}
              required
            />
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
