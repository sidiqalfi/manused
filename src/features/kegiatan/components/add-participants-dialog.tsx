"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { UserPlus } from "lucide-react"
import { addKegiatanParticipants } from "../actions/add-kegiatan-participants"
import { kegiatanKeys } from "../queries"

type Member = {
  id: string
  name: string
  fullName: string
  status: string
}

type Props = {
  kegiatanId: string
  /** Semua anggota (ACTIVE + INACTIVE) untuk picker */
  allMembers: Member[]
  /** memberId yang sudah jadi peserta */
  existingIds: Set<string>
}

export function AddKegiatanParticipantsDialog({
  kegiatanId,
  allMembers,
  existingIds,
}: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [onlyActive, setOnlyActive] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const queryClient = useQueryClient()

  const pool = onlyActive
    ? allMembers.filter((m) => m.status === "ACTIVE")
    : allMembers

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await addKegiatanParticipants(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
      setSelected(new Set())
      await queryClient.invalidateQueries({ queryKey: kegiatanKeys.all })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <UserPlus className="mr-1 h-4 w-4" />
        Tambah Peserta
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Peserta</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="kegiatanId" value={kegiatanId} />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(e) => setOnlyActive(e.target.checked)}
            />
            Tampilkan hanya anggota aktif
            <span className="text-xs text-muted-foreground">
              ({allMembers.filter((m) => m.status === "ACTIVE").length}/{allMembers.length})
            </span>
          </label>

          {pool.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada anggota.</p>
          ) : (
            <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border p-2">
              {pool.map((m) => {
                const isExisting = existingIds.has(m.id)
                const checked = selected.has(m.id)
                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${
                      isExisting ? "opacity-40" : "hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="memberIds"
                      value={m.id}
                      checked={checked || isExisting}
                      disabled={isExisting}
                      onChange={() => toggle(m.id)}
                    />
                    <span className="font-medium">{m.name}</span>
                    <span className="text-muted-foreground">— {m.fullName}</span>
                    {m.status === "INACTIVE" && (
                      <Badge variant="outline" className="ml-auto">Nonaktif</Badge>
                    )}
                  </label>
                )
              })}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {selected.size} dipilih
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={selected.size === 0}>
            Tambahkan
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
