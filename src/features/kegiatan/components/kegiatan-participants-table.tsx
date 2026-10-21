"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Trash2 } from "lucide-react"
import { AddKegiatanParticipantsDialog } from "./add-participants-dialog"
import { removeKegiatanParticipant } from "../actions/remove-kegiatan-participant"
import { updateKegiatanParticipant } from "../actions/update-kegiatan-participant"
import { kegiatanKeys } from "../queries"
import { formatCurrency } from "@/lib/format"

type Participant = {
  id: string
  memberId: string
  attending: boolean
  expectedAmount: number | null
  joinedAt: Date
  member: { id: string; name: string; fullName: string; status: string }
}

type Props = {
  kegiatanId: string
  feePerPerson: number
  participants: Participant[]
  allMembers: { id: string; name: string; fullName: string; status: string }[]
}

export function KegiatanParticipantsTable({
  kegiatanId,
  feePerPerson,
  participants,
  allMembers,
}: Props) {
  const [error, setError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<Participant | null>(null)
  const [editing, setEditing] = useState<Participant | null>(null)
  const queryClient = useQueryClient()

  const existingIds = new Set(participants.map((p) => p.memberId))

  async function handleRemove() {
    if (!removing) return
    const fd = new FormData()
    fd.set("kegiatanId", kegiatanId)
    fd.set("memberId", removing.memberId)
    const result = await removeKegiatanParticipant(fd)
    if (result.error) {
      setError(result.error)
    } else {
      setError(null)
      await queryClient.invalidateQueries({ queryKey: kegiatanKeys.all })
    }
    setRemoving(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {participants.length} peserta terdaftar
        </p>
        <AddKegiatanParticipantsDialog
          kegiatanId={kegiatanId}
          allMembers={allMembers}
          existingIds={existingIds}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nama</TableHead>
              <TableHead className="text-center">Kehadiran</TableHead>
              <TableHead className="text-center">Iuran</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Terdaftar</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Belum ada peserta. Klik &quot;Tambah Peserta&quot;.
                </TableCell>
              </TableRow>
            )}
            {participants.map((p) => {
              const expected = p.expectedAmount ?? feePerPerson
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <span className="font-medium">{p.member.name}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    {p.attending ? (
                      <Badge variant="default">Hadir</Badge>
                    ) : (
                      <Badge variant="outline">Patungan</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center tabular-nums text-sm">
                    {formatCurrency(expected)}
                    {p.expectedAmount !== null && (
                      <span className="block text-xs text-muted-foreground">
                        (iuran {formatCurrency(feePerPerson)})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={p.member.status === "ACTIVE" ? "default" : "outline"}>
                      {p.member.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {new Date(p.joinedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Edit peserta"
                        onClick={() => setEditing(p)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Hapus peserta"
                        onClick={() => setRemoving(p)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <EditParticipantDialog
        kegiatanId={kegiatanId}
        feePerPerson={feePerPerson}
        participant={editing}
        onClose={() => setEditing(null)}
      />

      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluarkan peserta ini?</AlertDialogTitle>
            <AlertDialogDescription>
              {removing?.member.name} ({removing?.member.fullName}) tidak lagi
              terdaftar di kegiatan ini. Riwayat pembayarannya tetap ada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleRemove}>
              Keluarkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EditParticipantDialog({
  kegiatanId,
  feePerPerson,
  participant,
  onClose,
}: {
  kegiatanId: string
  feePerPerson: number
  participant: Participant | null
  onClose: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [attending, setAttending] = useState(true)
  const [expected, setExpected] = useState("")
  const queryClient = useQueryClient()

  // Sync state form saat dialog dibuka dengan data peserta yang diedit.
  const editingId = participant?.id ?? null
  const [lastOpenedId, setLastOpenedId] = useState<string | null>(null)
  if (editingId !== null && editingId !== lastOpenedId) {
    setLastOpenedId(editingId)
    setAttending(participant!.attending)
    setExpected(
      participant!.expectedAmount !== null ? String(participant!.expectedAmount) : ""
    )
    setError(null)
  }

  async function handleSubmit(formData: FormData) {
    fd(formData)
    const result = await updateKegiatanParticipant(formData)
    if (result.error) {
      setError(result.error)
      return
    }
    setError(null)
    await queryClient.invalidateQueries({ queryKey: kegiatanKeys.all })
    onClose()
  }

  function fd(formData: FormData) {
    formData.set("kegiatanId", kegiatanId)
    formData.set("memberId", participant?.memberId ?? "")
    formData.set("attending", attending ? "true" : "false")
  }

  return (
    <Dialog open={participant !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Edit Peserta — {participant?.member.name}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={attending}
              onChange={(e) => setAttending(e.target.checked)}
            />
            Hadir di acara
          </label>
          {!attending && (
            <p className="text-xs text-muted-foreground">
              Ditandai patungan — tidak hadir tapi tetap iuran.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="expectedAmount">
              Iuran disepakati (default {formatCurrency(feePerPerson)})
            </Label>
            <Input
              type="number"
              name="expectedAmount"
              id="expectedAmount"
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
              min={0}
              placeholder={String(feePerPerson)}
            />
            <p className="text-xs text-muted-foreground">
              Kosongkan untuk memakai iuran default.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">Simpan</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
