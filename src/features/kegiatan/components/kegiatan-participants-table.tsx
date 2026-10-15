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
import { Trash2 } from "lucide-react"
import { AddKegiatanParticipantsDialog } from "./add-participants-dialog"
import { removeKegiatanParticipant } from "../actions/remove-kegiatan-participant"
import { kegiatanKeys } from "../queries"

type Participant = {
  id: string
  memberId: string
  joinedAt: Date
  member: { id: string; name: string; fullName: string; status: string }
}

type Props = {
  kegiatanId: string
  participants: Participant[]
  allMembers: { id: string; name: string; fullName: string; status: string }[]
}

export function KegiatanParticipantsTable({
  kegiatanId,
  participants,
  allMembers,
}: Props) {
  const [error, setError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<Participant | null>(null)
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
      <div className="flex items-center justify-between">
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nama</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Terdaftar</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  Belum ada peserta. Klik &quot;Tambah Peserta&quot;.
                </TableCell>
              </TableRow>
            )}
            {participants.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <span className="font-medium">{p.member.name}</span>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Hapus peserta"
                    onClick={() => setRemoving(p)}
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
