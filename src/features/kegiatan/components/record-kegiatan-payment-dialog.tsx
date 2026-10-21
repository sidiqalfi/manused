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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { createKegiatanPayment } from "../actions/create-kegiatan-payment"
import { kegiatanKeys } from "../queries"
import { formatCurrency } from "@/lib/format"

type Participant = {
  memberId: string
  attending: boolean
  expectedAmount: number | null
  member: { id: string; name: string; fullName: string }
}

type Props = {
  kegiatanId: string
  feePerPerson: number
  /** Peserta + total yang sudah dibayar masing-masing */
  participants: Participant[]
  paidBy: Record<string, number>
  /** Iuran disepakati per memberId (override feePerPerson untuk patungan) */
  expectedByMember?: Record<string, number>
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
}

export function RecordKegiatanPaymentDialog({
  kegiatanId,
  feePerPerson,
  participants,
  paidBy,
  expectedByMember = {},
  triggerVariant = "default",
}: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [memberId, setMemberId] = useState("")
  const [amount, setAmount] = useState<number>(feePerPerson)
  const queryClient = useQueryClient()

  const today = new Date().toISOString().split("T")[0]

  // Iuran yang disepakati untuk satu peserta (override patungan bila ada).
  const expectedOf = (id: string) => expectedByMember[id] ?? feePerPerson

  // Peserta yang belum lunas, urut nama.
  const owing = participants
    .filter((p) => (paidBy[p.memberId] ?? 0) < expectedOf(p.memberId))
    .sort((a, b) => a.member.name.localeCompare(b.member.name))

  function handleSelect(id: string) {
    setMemberId(id)
    // Pre-fill nominal dengan sisanya.
    if (id) {
      const paid = paidBy[id] ?? 0
      setAmount(Math.max(expectedOf(id) - paid, 0))
    }
  }

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await createKegiatanPayment(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
      setMemberId("")
      setAmount(feePerPerson)
      await queryClient.invalidateQueries({ queryKey: kegiatanKeys.all })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant={triggerVariant} />}>
        <Plus className="mr-1 h-4 w-4" />
        Catat Bayar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Catat Pembayaran Kegiatan</DialogTitle>
        </DialogHeader>
        {owing.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Semua peserta sudah lunas. 🎉
          </p>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="kegiatanId" value={kegiatanId} />

            <div className="space-y-2">
              <Label htmlFor="memberId">Peserta</Label>
              <select
                name="memberId"
                id="memberId"
                required
                value={memberId}
                onChange={(e) => handleSelect(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Pilih peserta</option>
                {owing.map((p) => {
                  const paid = paidBy[p.memberId] ?? 0
                  const remaining = expectedOf(p.memberId) - paid
                  return (
                    <option key={p.memberId} value={p.memberId}>
                      {p.member.name} — {p.member.fullName} (kurang {formatCurrency(remaining)})
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                Nominal (iuran {memberId ? formatCurrency(expectedOf(memberId)) : formatCurrency(feePerPerson)})
              </Label>
              <Input
                type="number"
                name="amount"
                id="amount"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={1}
                required
              />
              {memberId && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const paid = paidBy[memberId] ?? 0
                      setAmount(Math.max(expectedOf(memberId) - paid, 0))
                    }}
                  >
                    Sisa penuh ({formatCurrency(Math.max(expectedOf(memberId) - (paidBy[memberId] ?? 0), 0))})
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidAt">Tanggal Bayar</Label>
              <Input type="date" name="paidAt" id="paidAt" defaultValue={today} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Catatan (opsional)</Label>
              <Input type="text" name="note" id="note" placeholder="Cicilan 1, dll" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">Catat Pembayaran</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
