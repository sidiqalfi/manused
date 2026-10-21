"use client"

import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
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
import { RecordKegiatanPaymentDialog } from "./record-kegiatan-payment-dialog"
import { deleteKegiatanPayment } from "../actions/delete-kegiatan-payment"
import { kegiatanKeys } from "../queries"
import { formatCurrency } from "@/lib/format"

type Participant = {
  memberId: string
  member: { id: string; name: string; fullName: string }
}

type Payment = {
  id: string
  memberId: string
  amount: number
  paidAt: Date
  note?: string | null
  member: { id: string; name: string; fullName: string }
}

type Props = {
  kegiatanId: string
  feePerPerson: number
  participants: Participant[]
  payments: Payment[]
}

export function KegiatanPaymentsTable({
  kegiatanId,
  feePerPerson,
  participants,
  payments,
}: Props) {
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Payment | null>(null)
  const queryClient = useQueryClient()

  const paidBy = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of payments) {
      map[p.memberId] = (map[p.memberId] ?? 0) + p.amount
    }
    return map
  }, [payments])

  const rows = participants
    .map((p) => {
      const paid = paidBy[p.memberId] ?? 0
      const remaining = Math.max(feePerPerson - paid, 0)
      return { ...p, paid, remaining }
    })
    .sort((a, b) => a.member.name.localeCompare(b.member.name))

  const totalCollected = Object.values(paidBy).reduce((s, v) => s + v, 0)

  async function handleDelete() {
    if (!deleting) return
    const fd = new FormData()
    fd.set("id", deleting.id)
    const result = await deleteKegiatanPayment(fd)
    if (result.error) {
      setError(result.error)
    } else {
      setError(null)
      await queryClient.invalidateQueries({ queryKey: kegiatanKeys.all })
    }
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Terkumpul {formatCurrency(totalCollected)} dari {formatCurrency(feePerPerson * participants.length)}
        </p>
        <RecordKegiatanPaymentDialog
          kegiatanId={kegiatanId}
          feePerPerson={feePerPerson}
          participants={participants}
          paidBy={paidBy}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Peserta</TableHead>
              <TableHead className="text-center">Bayar</TableHead>
              <TableHead className="text-center">Sisa</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Riwayat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  Belum ada peserta.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.memberId}>
                <TableCell>
                  <span className="font-medium">{r.member.name}</span>
                </TableCell>
                <TableCell className="text-center tabular-nums text-sm">
                  {formatCurrency(r.paid)}
                </TableCell>
                <TableCell className="text-center tabular-nums text-sm">
                  {r.remaining > 0 ? (
                    <span className="text-destructive">{formatCurrency(r.remaining)}</span>
                  ) : (
                    <span className="text-muted-foreground">–</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {r.remaining > 0 ? (
                    <Badge variant="outline" className="border-destructive/50 text-destructive">
                      Kurang
                    </Badge>
                  ) : (
                    <Badge variant="default">Lunas</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2 text-xs text-muted-foreground">
                    {payments
                      .filter((p) => p.memberId === r.memberId)
                      .map((p) => (
                        <span key={p.id} className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            aria-label="Hapus pembayaran"
                            className="hover:text-destructive"
                            onClick={() => setDeleting(p)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                          {formatCurrency(p.amount)}
                        </span>
                      ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pembayaran ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Pembayaran {deleting?.member.name} sebesar{" "}
              {deleting ? formatCurrency(deleting.amount) : ""} akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
