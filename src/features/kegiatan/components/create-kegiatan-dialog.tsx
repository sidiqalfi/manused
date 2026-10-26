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
import { Plus } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { createKegiatan } from "../actions/create-kegiatan"
import { kegiatanKeys } from "../queries"
import { KEGIATAN_STATUS_LABEL } from "../kegiatan-schemas"

export function CreateKegiatanDialog({
  triggerVariant = "default",
}: {
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const today = todayLocalISO()

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await createKegiatan(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
      await queryClient.invalidateQueries({ queryKey: kegiatanKeys.all })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant={triggerVariant} />}>
        <Plus className="mr-1 h-4 w-4" />
        Kegiatan Baru
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Kegiatan Baru</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Kegiatan</Label>
            <Input
              type="text"
              name="name"
              id="name"
              placeholder="HUT Muda Mudi — Outbound New Rivermoon"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventDate">Tanggal</Label>
              <Input
                type="date"
                name="eventDate"
                id="eventDate"
                defaultValue={today}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feePerPerson">Iuran per Orang (Rp)</Label>
              <Input
                type="number"
                name="feePerPerson"
                id="feePerPerson"
                placeholder="50000"
                defaultValue={50000}
                min={0}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Lokasi (opsional)</Label>
            <Input
              type="text"
              name="location"
              id="location"
              placeholder="New Rivermoon"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              name="status"
              id="status"
              defaultValue="PLANNED"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {Object.entries(KEGIATAN_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Catatan (opsional)</Label>
            <Input type="text" name="note" id="note" placeholder="Catatan..." />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">Buat Kegiatan</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
