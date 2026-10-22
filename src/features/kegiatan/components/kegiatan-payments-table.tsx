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
import { SortButton, type SortDirection } from "@/components/ui/sort-button"
import { RecordKegiatanPaymentDialog } from "./record-kegiatan-payment-dialog"
import { deleteKegiatanPayment } from "../actions/delete-kegiatan-payment"
import { kegiatanKeys } from "../queries"
import { formatCurrency } from "@/lib/format"

type Participant = {
  memberId: string
  attending: boolean
  expectedAmount: number | null
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

type SortKey = "name" | "paid" | "remaining" | "status"

const PAYMENT_COLUMNS: {
  key: SortKey
  label: string
  align: "left" | "center" | "right"
}[] = [
  { key: "name", label: "Peserta", align: "left" },
  { key: "paid", label: "Bayar", align: "center" },
  { key: "remaining", label: "Sisa", align: "center" },
  { key: "status", label: "Status", align: "center" },
]

export function KegiatanPaymentsTable({
  kegiatanId,
  feePerPerson,
  participants,
  payments,
}: Props) {
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Payment | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const queryClient = useQueryClient()

  const paidBy = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of payments) {
      map[p.memberId] = (map[p.memberId] ?? 0) + p.amount
    }
    return map
  }, [payments])

  // Iuran yang disepakati per peserta (override patungan), fallback fee.
  const expectedByMember = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of participants) {
      map[p.memberId] = p.expectedAmount ?? feePerPerson
    }
    return map
  }, [participants, feePerPerson])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      // Default: nama naik (A→Z), angka turun (besar dulu), status turun (Kurang dulu).
      setSortDirection(key === "name" ? "asc" : "desc")
    }
  }

  const rows = participants
    .map((p) => {
      const expected = expectedByMember[p.memberId] ?? feePerPerson
      const paid = paidBy[p.memberId] ?? 0
      const remaining = Math.max(expected - paid, 0)
      return { ...p, expected, paid, remaining }
    })
    .sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1
      switch (sortKey) {
        case "paid":
          if (a.paid !== b.paid) return (a.paid - b.paid) * dir
          return a.member.name.localeCompare(b.member.name)
        case "remaining":
          if (a.remaining !== b.remaining) return (a.remaining - b.remaining) * dir
          return a.member.name.localeCompare(b.member.name)
        case "status": {
          // Kurang = 1, Lunas = 0. Dengan desc, "Kurang" muncul lebih dulu.
          const sa = a.remaining > 0 ? 1 : 0
          const sb = b.remaining > 0 ? 1 : 0
          if (sa !== sb) return (sa - sb) * dir
          return a.member.name.localeCompare(b.member.name)
        }
        case "name":
        default:
          return a.member.name.localeCompare(b.member.name) * dir
      }
    })

  const totalExpected = participants.reduce(
    (s, p) => s + (p.expectedAmount ?? feePerPerson),
    0
  )
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
          Terkumpul {formatCurrency(totalCollected)} dari {formatCurrency(totalExpected)}
        </p>
        <RecordKegiatanPaymentDialog
          kegiatanId={kegiatanId}
          feePerPerson={feePerPerson}
          participants={participants}
          paidBy={paidBy}
          expectedByMember={expectedByMember}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {PAYMENT_COLUMNS.map((c) => (
                <TableHead
                  key={c.key}
                  className={
                    c.align === "center"
                      ? "text-center"
                      : c.align === "right"
                        ? "text-right"
                        : undefined
                  }
                >
                  <SortButton
                    align={c.align}
                    active={sortKey === c.key}
                    direction={sortDirection}
                    onClick={() => toggleSort(c.key)}
                  >
                    {c.label}
                  </SortButton>
                </TableHead>
              ))}
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
                  {!r.attending && (
                    <Badge variant="outline" className="ml-2">Patungan</Badge>
                  )}
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

