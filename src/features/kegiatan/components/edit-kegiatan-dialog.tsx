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
import { Pencil } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { updateKegiatan } from "../actions/update-kegiatan"
import { kegiatanKeys } from "../queries"
import { KEGIATAN_STATUS_LABEL } from "../kegiatan-schemas"

type Kegiatan = {
  id: string
  name: string
  eventDate: Date | string
  location: string | null
  feePerPerson: number
  status: string
  note: string | null
}

export function EditKegiatanDialog({ kegiatan }: { kegiatan: Kegiatan }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // eventDate tersimpan sebagai Date UTC tengah malam — tampilkan
  // bagian YYYY-MM-DD saja agar cocok dengan <input type="date">.
  const dateValue = new Date(kegiatan.eventDate).toISOString().split("T")[0]

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await updateKegiatan(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
      await queryClient.invalidateQueries({ queryKey: kegiatanKeys.all })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Pencil className="mr-1 h-4 w-4" />
        Edit
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Kegiatan</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="id" value={kegiatan.id} />
          <div className="space-y-2">
            <Label htmlFor={`name-${kegiatan.id}`}>Nama Kegiatan</Label>
            <Input
              type="text"
              name="name"
              id={`name-${kegiatan.id}`}
              defaultValue={kegiatan.name}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`eventDate-${kegiatan.id}`}>Tanggal</Label>
              <Input
                type="date"
                name="eventDate"
                id={`eventDate-${kegiatan.id}`}
                defaultValue={dateValue}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`feePerPerson-${kegiatan.id}`}>
                Iuran per Orang (Rp)
              </Label>
              <Input
                type="number"
                name="feePerPerson"
                id={`feePerPerson-${kegiatan.id}`}
                defaultValue={kegiatan.feePerPerson}
                min={0}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`location-${kegiatan.id}`}>Lokasi (opsional)</Label>
            <Input
              type="text"
              name="location"
              id={`location-${kegiatan.id}`}
              defaultValue={kegiatan.location ?? ""}
              placeholder="New Rivermoon"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`status-${kegiatan.id}`}>Status</Label>
            <select
              name="status"
              id={`status-${kegiatan.id}`}
              defaultValue={kegiatan.status}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {Object.entries(KEGIATAN_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`note-${kegiatan.id}`}>Catatan (opsional)</Label>
            <Input
              type="text"
              name="note"
              id={`note-${kegiatan.id}`}
              defaultValue={kegiatan.note ?? ""}
              placeholder="Catatan..."
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">Simpan Perubahan</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
