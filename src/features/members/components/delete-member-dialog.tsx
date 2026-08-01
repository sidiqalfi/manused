"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { deleteMember } from "@features/members/actions/delete-member"

interface DeleteMemberDialogProps {
  id: string
  name: string
}

export function DeleteMemberDialog({ id, name }: DeleteMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)

    const result = await deleteMember(id)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            aria-label={`Hapus ${name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus Anggota</DialogTitle>
          <DialogDescription>
            Apakah kamu yakin ingin menghapus <strong>{name}</strong>? Tindakan
            ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Menghapus..." : "Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
