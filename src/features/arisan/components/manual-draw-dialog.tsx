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
import { todayLocalISO } from "@/lib/format"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserCheck } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { performManualArisanDraw } from "../actions/perform-manual-arisan-draw"
import { arisanKeys } from "../queries"

type Member = {
  id: string
  name: string
  fullName: string
}

type Props = {
  periodId: string
  activeHeads: Member[]
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
}

export function ManualDrawDialog({
  periodId,
  activeHeads,
  triggerVariant = "outline",
}: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const today = todayLocalISO()

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await performManualArisanDraw(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
      await queryClient.invalidateQueries({ queryKey: arisanKeys.all })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant={triggerVariant}>
            <UserCheck data-icon="inline-start" />
            Kocok Manual
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kocok Manual Arisan</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Pilih pemenang sesuai hasil kocokan di pertemuan offline.
        </p>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="periodId" value={periodId} />

          <div className="space-y-2">
            <Label htmlFor="manual-winner">Pemenang</Label>
            <select
              name="winnerMemberId"
              id="manual-winner"
              required
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Pilih Anggota</option>
              {activeHeads.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} - {m.fullName}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Semua kepala rumah aktif bisa dipilih, termasuk yang belum bayar.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-drawn-at">Tanggal Kocok</Label>
            <Input
              type="date"
              name="drawnAt"
              id="manual-drawn-at"
              defaultValue={today}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full">Simpan Pemenang</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
